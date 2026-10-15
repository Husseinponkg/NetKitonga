import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from config.db import connection


TANZANIA_TZ = ZoneInfo("Africa/Dar_es_Salaam")


class FreeRADIUSService:
    def __init__(self) -> None:
        self.system_domain = os.getenv(
            "SYSTEM_SERVER_IP",
            "127.0.0.1",
        )

        self.api_scheme = (
            "https"
            if str(os.getenv("SYSTEM_DOMAIN", "")).startswith("https://")
            else "http"
        )

        self.api_port = "" if self.api_scheme == "https" else ":8000"

        self.api_base_url = (
            f"{self.api_scheme}://"
            f"{self.system_domain}"
            f"{self.api_port}"
        )

    # ============================================================
    # NORMALIZE MAC ADDRESS
    # ============================================================

    @staticmethod
    def _normalize_mac(mac_address: str) -> str:
        return (
            str(mac_address or "")
            .strip()
            .upper()
            .replace(":", "")
            .replace("-", "")
            .replace(".", "")
        )

    # ============================================================
    # CALCULATE REMAINING SESSION TIME
    #
    # IMPORTANT:
    # RADIUS Session-Timeout expects SECONDS remaining.
    #
    # PostgreSQL/session timestamps in this system are treated
    # as Tanzania local time: Africa/Dar_es_Salaam.
    # ============================================================

    @staticmethod
    def _remaining_seconds(expiration_time: Any) -> int:
        if not expiration_time:
            return 0

        try:
            if isinstance(expiration_time, datetime):

                # If PostgreSQL returned a timezone-naive timestamp,
                # interpret it as Tanzania time.
                if expiration_time.tzinfo is None:
                    expiration_time = expiration_time.replace(
                        tzinfo=TANZANIA_TZ
                    )
                else:
                    # Convert an already timezone-aware timestamp
                    # to Tanzania time.
                    expiration_time = expiration_time.astimezone(
                        TANZANIA_TZ
                    )

                now = datetime.now(TANZANIA_TZ)

                remaining = int(
                    (expiration_time - now).total_seconds()
                )

                return max(0, remaining)

            return 0

        except Exception:
            return 0

    # ============================================================
    # GET ACTIVE SESSION FOR MAC
    # ============================================================

    async def get_active_session_for_mac(
        self,
        tenant_id: int,
        mac_address: str,
        router_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:

        normalized_mac = self._normalize_mac(mac_address)

        if not normalized_mac:
            return None

        conn = await connection()

        try:
            async with conn.cursor() as cursor:

                params: List[Any] = [
                    normalized_mac
                ]

                router_filter = ""

                if router_id:
                    router_filter = """
                        AND s.router_id = %s
                    """

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

                await cursor.execute(
                    query,
                    tuple(params),
                )

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

    # ============================================================
    # AUTHENTICATE USER
    # ============================================================

    async def authenticate(
        self,
        username: str,
        password: str,
        calling_station_id: Optional[str] = None,
        nas_identifier: Optional[str] = None,
        nas_ip_address: Optional[str] = None,
        framed_ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:

        # MikroTik normally sends the client MAC through
        # Calling-Station-Id.
        mac_address = self._normalize_mac(
            calling_station_id
            or username
            or ""
        )

        if not mac_address:
            return {
                "control:Auth-Type": "Reject",
                "reply:Reply-Message": (
                    "Missing customer identity."
                ),
            }

        # ========================================================
        # FIND ROUTER USING NAS IDENTIFIER
        # ========================================================

        router_id: Optional[int] = None

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
                        (
                            str(nas_identifier).strip(),
                        ),
                    )

                    router_row = await cursor.fetchone()

                    if router_row:
                        router_id = router_row[0]

            finally:
                await conn.close()

        # ========================================================
        # FIND ACTIVE INTERNET SESSION
        # ========================================================

        session = await self.get_active_session_for_mac(
            tenant_id=0,
            mac_address=mac_address,
            router_id=router_id,
        )

        if not session:

            return {
                "control:Auth-Type": "Reject",
                "reply:Reply-Message": (
                    "No active internet session found. "
                    "Please purchase a package or redeem "
                    "a voucher."
                ),
            }

        # ========================================================
        # CHECK SESSION EXPIRATION
        # ========================================================

        expiration_time = session.get(
            "expiration_time"
        )

        remaining_seconds = self._remaining_seconds(
            expiration_time
        )

        if remaining_seconds <= 0:

            return {
                "control:Auth-Type": "Reject",
                "reply:Reply-Message": (
                    "Your internet session has expired. "
                    "Please purchase another package."
                ),
            }

        # ========================================================
        # ACCESS ACCEPT
        # ========================================================

        response: Dict[str, Any] = {
            "control:Auth-Type": "Accept",

            # VERY IMPORTANT:
            # Session-Timeout is duration in seconds,
            # NOT Unix timestamp.
            "reply:Session-Timeout": remaining_seconds,

            "reply:Reply-Message": (
                "Access granted by NetKitonga billing backend."
            ),
        }

        # ========================================================
        # ASSIGNED IP
        # ========================================================

        if session.get("assigned_ip"):

            response[
                "reply:Framed-IP-Address"
            ] = session["assigned_ip"]

        elif framed_ip_address:

            response[
                "reply:Framed-IP-Address"
            ] = framed_ip_address

        # ========================================================
        # MIKROTIK RATE LIMIT
        # ========================================================

        if session.get("mikrotik_rate_limit"):

            response[
                "reply:Mikrotik-Rate-Limit"
            ] = session[
                "mikrotik_rate_limit"
            ]

        return response

    # ============================================================
    # ACCOUNTING
    # ============================================================

    async def accounting(
        self,
        username: Optional[str] = None,
        calling_station_id: Optional[str] = None,
        nas_identifier: Optional[str] = None,
        session_id: Optional[str] = None,
        framed_ip_address: Optional[str] = None,
        acct_status_type: Optional[str] = None,
        acct_input_octets: Optional[Any] = None,
        acct_output_octets: Optional[Any] = None,
        acct_session_time: Optional[Any] = None,
        event_timestamp: Optional[Any] = None,
    ) -> Dict[str, Any]:

        mac_address = self._normalize_mac(
            calling_station_id
            or username
            or ""
        )

        if not mac_address:

            return {
                "status": "ignored",
                "message": "Missing customer identity.",
            }

        conn = await connection()

        try:

            async with conn.cursor() as cursor:

                # ====================================================
                # FIND ACTIVE SESSION
                # ====================================================

                await cursor.execute(
                    """
                    SELECT
                        s.id,
                        s.session_id,
                        s.status
                    FROM active_sessions s

                    JOIN buyers b
                        ON b.id = s.buyer_id

                    WHERE REPLACE(
                            REPLACE(
                                UPPER(b.buyer_mac),
                                ':',
                                ''
                            ),
                            '-',
                            ''
                          ) = %s

                      AND (
                          s.session_id = %s
                          OR %s IS NULL
                      )

                    ORDER BY s.start_time DESC

                    LIMIT 1;
                    """,
                    (
                        mac_address,
                        session_id,
                        session_id,
                    ),
                )

                row = await cursor.fetchone()

                if not row:

                    return {
                        "status": "ignored",
                        "message": (
                            "No matching session found."
                        ),
                    }

                db_session_id = row[0]
                stored_session_id = row[1]
                stored_status = row[2]

                # ====================================================
                # SAFE INTEGER CONVERSION
                # ====================================================

                def safe_int(value: Any) -> int:

                    try:
                        if value is None:
                            return 0

                        return int(value)

                    except (
                        ValueError,
                        TypeError,
                    ):
                        return 0

                input_octets = safe_int(
                    acct_input_octets
                )

                output_octets = safe_int(
                    acct_output_octets
                )

                session_time = safe_int(
                    acct_session_time
                )

                # ====================================================
                # ACCOUNTING START / INTERIM / UPDATE
                # ====================================================

                if acct_status_type in (
                    "Start",
                    "Interim-Update",
                    "Accounting-On",
                ):

                    await cursor.execute(
                        """
                        UPDATE active_sessions
                        SET
                            bytes_uploaded = %s,
                            bytes_downloaded = %s
                        WHERE id = %s;
                        """,
                        (
                            input_octets,
                            output_octets,
                            db_session_id,
                        ),
                    )

                # ====================================================
                # ACCOUNTING STOP
                # ====================================================

                elif acct_status_type in (
                    "Stop",
                    "Accounting-Off",
                ):

                    await cursor.execute(
                        """
                        UPDATE active_sessions
                        SET
                            bytes_uploaded = %s,
                            bytes_downloaded = %s,
                            status = 'terminated'
                        WHERE id = %s;
                        """,
                        (
                            input_octets,
                            output_octets,
                            db_session_id,
                        ),
                    )

                # ====================================================
                # OTHER ACCOUNTING UPDATE
                # ====================================================

                else:

                    await cursor.execute(
                        """
                        UPDATE active_sessions
                        SET
                            bytes_uploaded = %s,
                            bytes_downloaded = %s
                        WHERE id = %s;
                        """,
                        (
                            input_octets,
                            output_octets,
                            db_session_id,
                        ),
                    )

                await conn.commit()

                return {
                    "status": "success",
                    "message": (
                        "Accounting information "
                        "processed successfully."
                    ),
                    "session_id": (
                        stored_session_id
                    ),
                    "session_status": (
                        stored_status
                    ),
                    "acct_status_type": (
                        acct_status_type
                    ),
                    "acct_input_octets": (
                        input_octets
                    ),
                    "acct_output_octets": (
                        output_octets
                    ),
                    "acct_session_time": (
                        session_time
                    ),
                }

        except Exception:

            await conn.rollback()

            raise

        finally:

            await conn.close()