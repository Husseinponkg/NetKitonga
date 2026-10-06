
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from config.db import connection


class FreeRADIUSService:
    """
    FreeRADIUS integration service.

    NetKitonga uses active_sessions as the source of truth for
    customer authorization.

    Flow:
        MikroTik
            ↓
        FreeRADIUS
            ↓
        NetKitonga REST API
            ↓
        PostgreSQL active_sessions
    """

    def __init__(self) -> None:
        self.system_domain = os.getenv("SYSTEM_SERVER_IP", "127.0.0.1")

        self.api_scheme = (
            "https"
            if str(os.getenv("SYSTEM_DOMAIN", "")).startswith("https://")
            else "http"
        )

        self.api_port = "" if self.api_scheme == "https" else ":8000"

        self.api_base_url = (
            f"{self.api_scheme}://{self.system_domain}{self.api_port}"
        )

    async def get_active_session_for_mac(
        self,
        tenant_id: int,
        mac_address: str,
        router_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Find an active internet session for a customer's MAC address.

        The database remains the source of truth.

        tenant_id is retained for compatibility with the existing
        service interface. Router identification is currently used
        to identify the correct NAS/router.
        """

        normalized_mac = (
            str(mac_address or "")
            .strip()
            .upper()
            .replace(":", "")
            .replace("-", "")
        )

        if not normalized_mac:
            return None

        conn = await connection()

        try:
            async with conn.cursor() as cursor:

                params: List[Any] = [normalized_mac]

                router_filter = ""

                if router_id:
                    router_filter = "AND s.router_id = %s"
                    params.append(router_id)

                query = f"""
                    SELECT
                        s.id,
                        s.session_id,
                        s.assigned_ip,
                        s.expiration_time,
                        s.bytes_uploaded,
                        s.bytes_downloaded,
                        s.status,
                        p.mikrotik_rate_limit,
                        r.driver_type,
                        r.radius_secret,
                        r.nas_identifier,
                        r.ip_address
                    FROM active_sessions s
                    JOIN routers r
                        ON r.id = s.router_id
                    JOIN payments pay
                        ON pay.id = s.payment_id
                    JOIN packages p
                        ON p.id = pay.package_id
                    JOIN buyers b
                        ON b.id = s.buyer_id
                    WHERE s.status = 'active'
                      AND s.expiration_time > NOW()
                      AND REPLACE(
                            REPLACE(
                                UPPER(b.buyer_mac),
                                ':',
                                ''
                            ),
                            '-',
                            ''
                          ) = %s
                      {router_filter}
                    ORDER BY s.start_time DESC
                    LIMIT 1;
                """

                await cursor.execute(query, tuple(params))

                row = await cursor.fetchone()

                if not row:
                    return None

                (
                    session_id,
                    session_identifier,
                    assigned_ip,
                    expiration_time,
                    bytes_uploaded,
                    bytes_downloaded,
                    status,
                    mikrotik_rate_limit,
                    driver_type,
                    radius_secret,
                    nas_identifier,
                    router_ip,
                ) = row

                return {
                    "id": session_id,
                    "session_id": session_id,
                    "session_identifier": session_identifier,
                    "assigned_ip": assigned_ip,
                    "expiration_time": expiration_time,
                    "bytes_uploaded": bytes_uploaded or 0,
                    "bytes_downloaded": bytes_downloaded or 0,
                    "status": status,
                    "mikrotik_rate_limit": mikrotik_rate_limit,
                    "driver_type": driver_type,
                    "radius_secret": radius_secret,
                    "nas_identifier": nas_identifier,
                    "router_ip": router_ip,
                }

        finally:
            await conn.close()

    @staticmethod
    def _remaining_seconds(expiration_time: Any) -> int:
        """
        Convert an expiration timestamp into the number of seconds
        remaining from now.

        IMPORTANT:
        RADIUS Session-Timeout expects a duration in seconds,
        NOT a Unix timestamp.
        """

        if not expiration_time:
            return 86400

        try:
            if isinstance(expiration_time, datetime):

                if expiration_time.tzinfo is None:
                    expiration_time = expiration_time.replace(
                        tzinfo=timezone.utc
                    )

                now = datetime.now(timezone.utc)

                remaining = int(
                    (expiration_time - now).total_seconds()
                )

                return max(0, remaining)

            return 86400

        except Exception:
            return 86400

    async def authenticate(
        self,
        username: str,
        password: str,
        calling_station_id: Optional[str] = None,
        nas_identifier: Optional[str] = None,
        nas_ip_address: Optional[str] = None,
        framed_ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Authorize a customer using an active NetKitonga session.

        The returned JSON uses FreeRADIUS rlm_rest attribute syntax:

            control:Auth-Type
            reply:Session-Timeout
            reply:Reply-Message
            reply:Framed-IP-Address
            reply:Mikrotik-Rate-Limit
        """

        mac_address = (
            calling_station_id
            or username
            or ""
        ).strip().upper().replace(":", "").replace("-", "")

        if not mac_address:
            return {
                "control:Auth-Type": "Reject",
                "reply:Reply-Message": "Missing customer identity.",
            }

        # ---------------------------------------------------------
        # Find the MikroTik router using NAS-Identifier
        # ---------------------------------------------------------

        router_id = None

        if nas_identifier:

            conn = await connection()

            try:
                async with conn.cursor() as cursor:

                    await cursor.execute(
                        """
                        SELECT id
                        FROM routers
                        WHERE nas_identifier = %s
                          AND driver_type = 'mikrotik_radius'
                        LIMIT 1;
                        """,
                        (str(nas_identifier).strip(),),
                    )

                    router_row = await cursor.fetchone()

                    if router_row:
                        router_id = router_row[0]

            finally:
                await conn.close()

        # ---------------------------------------------------------
        # Find active customer session
        # ---------------------------------------------------------

        session = await self.get_active_session_for_mac(
            tenant_id=0,
            mac_address=mac_address,
            router_id=router_id,
        )

        # ---------------------------------------------------------
        # No active session = reject
        # ---------------------------------------------------------

        if not session:

            return {
                "control:Auth-Type": "Reject",
                "reply:Reply-Message": (
                    "No active internet session found. "
                    "Please purchase a package or redeem a voucher."
                ),
            }

        # ---------------------------------------------------------
        # Calculate remaining session time
        # ---------------------------------------------------------

        remaining_seconds = self._remaining_seconds(
            session.get("expiration_time")
        )

        # Session expired
        if remaining_seconds <= 0:

            return {
                "control:Auth-Type": "Reject",
                "reply:Reply-Message": (
                    "Your internet session has expired. "
                    "Please purchase another package."
                ),
            }

        # ---------------------------------------------------------
        # Access-Accept response
        # ---------------------------------------------------------

        response: Dict[str, Any] = {
            "control:Auth-Type": "Accept",
            "reply:Session-Timeout": remaining_seconds,
            "reply:Reply-Message": (
                "Access granted by NetKitonga billing backend."
            ),
        }

        # ---------------------------------------------------------
        # Assigned IP
        # ---------------------------------------------------------

        if session.get("assigned_ip"):

            response["reply:Framed-IP-Address"] = (
                session["assigned_ip"]
            )

        elif framed_ip_address:

            response["reply:Framed-IP-Address"] = (
                framed_ip_address
            )

        # ---------------------------------------------------------
        # MikroTik rate limit
        # ---------------------------------------------------------

        if session.get("mikrotik_rate_limit"):

            response["reply:Mikrotik-Rate-Limit"] = (
                session["mikrotik_rate_limit"]
            )

        return response

    async def accounting(
        self,
        username: str,
        calling_station_id: Optional[str] = None,
        nas_identifier: Optional[str] = None,
        session_id: Optional[str] = None,
        framed_ip_address: Optional[str] = None,
        acct_status_type: Optional[str] = None,
        acct_input_octets: Optional[int] = None,
        acct_output_octets: Optional[int] = None,
        acct_session_time: Optional[int] = None,
        event_timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        RADIUS accounting handler.

        Updates traffic usage and session lifecycle information
        inside active_sessions.
        """

        mac_address = (
            calling_station_id
            or username
            or ""
        ).strip().upper().replace(":", "").replace("-", "")

        if not mac_address:

            return {
                "status": "ignored",
                "reason": "missing_identity",
            }

        conn = await connection()

        try:
            async with conn.cursor() as cursor:

                await cursor.execute(
                    """
                    SELECT
                        s.id,
                        s.session_id,
                        s.buyer_id,
                        s.router_id,
                        s.tenant_id
                    FROM active_sessions s
                    JOIN buyers b
                        ON b.id = s.buyer_id
                    WHERE s.status = 'active'
                      AND REPLACE(
                            REPLACE(
                                UPPER(b.buyer_mac),
                                ':',
                                ''
                            ),
                            '-',
                            ''
                          ) = %s
                      AND (
                            s.session_id = COALESCE(
                                %s,
                                s.session_id
                            )
                            OR %s IS NULL
                      )
                    LIMIT 1;
                    """,
                    (
                        mac_address,
                        session_id,
                        session_id,
                    ),
                )

                session_row = await cursor.fetchone()

                if not session_row:

                    return {
                        "status": "ignored",
                        "reason": "no_active_session",
                    }

                (
                    local_session_id,
                    db_session_id,
                    buyer_id,
                    router_id,
                    tenant_id,
                ) = session_row

                if not acct_status_type:

                    return {
                        "status": "ignored",
                        "reason": "missing_status_type",
                    }

                normalized_status = (
                    str(acct_status_type)
                    .strip()
                    .lower()
                )

                uploaded = acct_input_octets or 0
                downloaded = acct_output_octets or 0

                # -------------------------------------------------
                # START / INTERIM UPDATE
                # -------------------------------------------------

                if normalized_status in (
                    "start",
                    "interim-update",
                ):

                    await cursor.execute(
                        """
                        UPDATE active_sessions
                        SET
                            bytes_uploaded =
                                bytes_uploaded + %s,
                            bytes_downloaded =
                                bytes_downloaded + %s
                        WHERE id = %s;
                        """,
                        (
                            uploaded,
                            downloaded,
                            local_session_id,
                        ),
                    )

                # -------------------------------------------------
                # STOP / ACCOUNTING OFF
                # -------------------------------------------------

                elif normalized_status in (
                    "stop",
                    "accounting-off",
                ):

                    await cursor.execute(
                        """
                        UPDATE active_sessions
                        SET
                            status = 'terminated',
                            bytes_uploaded =
                                bytes_uploaded + %s,
                            bytes_downloaded =
                                bytes_downloaded + %s
                        WHERE id = %s;
                        """,
                        (
                            uploaded,
                            downloaded,
                            local_session_id,
                        ),
                    )

                # -------------------------------------------------
                # OTHER ACCOUNTING EVENTS
                # -------------------------------------------------

                else:

                    await cursor.execute(
                        """
                        UPDATE active_sessions
                        SET
                            bytes_uploaded =
                                bytes_uploaded + %s,
                            bytes_downloaded =
                                bytes_downloaded + %s
                        WHERE id = %s;
                        """,
                        (
                            uploaded,
                            downloaded,
                            local_session_id,
                        ),
                    )

                await conn.commit()

                return {
                    "status": "recorded",
                    "session_id": db_session_id,
                    "local_session_id": local_session_id,
                }

        finally:
            await conn.close()

    def build_clients_config(
        self,
        routers: List[Dict[str, Any]],
    ) -> str:
        """
        Generate a FreeRADIUS clients.conf configuration.
        """

        lines = [
            "# Net Kitonga FreeRADIUS clients",
            "",
        ]

        for router in routers:

            name = (
                router.get("router_name")
                or router.get("nas_identifier")
                or router.get("ip_address")
                or "unknown"
            )

            ip_address = router.get("ip_address")

            radius_secret = (
                router.get("radius_secret")
                or os.getenv("RADIUS_GLOBAL_SECRET")
                or "CHANGE_ME"
            )

            lines.extend(
                [
                    f"client {name} {{",
                    f"    ipaddr = {ip_address}",
                    f"    secret = {radius_secret}",
                    "    require_message_authenticator = no",
                    "    nastype = other",
                    "}",
                    "",
                ]
            )

        return "\n".join(lines)

    def build_users_config(
        self,
        users: List[Dict[str, Any]],
    ) -> str:
        """
        Generate a FreeRADIUS users-style configuration.

        NetKitonga normally uses active_sessions for authorization,
        so no fake/test users are created here.
        """

        lines = [
            "# Net Kitonga users",
            "",
        ]

        for user in users:

            mac = (
                user.get("mac_address")
                or user.get("buyer_mac")
            )

            if not mac:
                continue

            mac_clean = (
                str(mac)
                .upper()
                .replace(":", "")
                .replace("-", "")
            )

            lines.extend(
                [
                    f'"{mac_clean}" Cleartext-Password := "{mac_clean}"',
                    "    Service-Type = Framed-User,",
                    "    Framed-Protocol = PPP,",
                    "    Framed-IP-Address = 255.255.255.254,",
                    "    Framed-IP-Netmask = 255.255.255.0,",
                    "    Framed-Routing = Broadcast-Listen,",
                    '    Framed-Filter-ID = "default-outbound-acl"',
                    "",
                ]
            )

        return "\n".join(lines)
