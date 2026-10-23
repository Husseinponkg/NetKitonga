import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from config.db import connection

TANZANIA_TZ = ZoneInfo("Africa/Dar_es_Salaam")


class FreeRADIUSService:
    """Bridge between FreeRADIUS REST requests and NetKitonga active sessions."""

    def __init__(self) -> None:
        # SYSTEM_DOMAIN may be a hostname or a URL; avoid malformed base URLs.
        configured = (os.getenv("SYSTEM_DOMAIN") or os.getenv("SYSTEM_SERVER_IP") or "127.0.0.1").strip()
        configured = re.sub(r"^https?://", "", configured, flags=re.IGNORECASE).rstrip("/")
        self.api_scheme = "https" if os.getenv("SYSTEM_DOMAIN", "").startswith("https://") else "http"
        self.api_port = "" if self.api_scheme == "https" or configured.endswith(":8000") else ":8000"
        self.system_domain = configured
        self.api_base_url = f"{self.api_scheme}://{self.system_domain}{self.api_port}"

    @staticmethod
    def _normalize_mac(mac_address: Optional[str]) -> str:
        return re.sub(r"[^0-9A-F]", "", str(mac_address or "").strip().upper())

    @staticmethod
    def _remaining_seconds(expiration_time: Any) -> int:
        if not isinstance(expiration_time, datetime):
            return 0
        try:
            if expiration_time.tzinfo is None:
                expiration_time = expiration_time.replace(tzinfo=TANZANIA_TZ)
            else:
                expiration_time = expiration_time.astimezone(TANZANIA_TZ)
            return max(0, int((expiration_time - datetime.now(TANZANIA_TZ)).total_seconds()))
        except (OverflowError, TypeError, ValueError):
            return 0

    async def get_active_session_for_mac(
        self,
        tenant_id: Optional[int],
        mac_address: str,
        router_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """Return the newest unexpired active session matching MAC and optional router."""
        normalized_mac = self._normalize_mac(mac_address)
        if len(normalized_mac) != 12:
            return None

        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                params: List[Any] = [normalized_mac]
                router_filter = ""
                if router_id is not None:
                    router_filter = " AND s.router_id = %s"
                    params.append(router_id)

                tenant_filter = ""
                if tenant_id is not None:
                    tenant_filter = " AND r.tenant_id = %s"
                    params.append(tenant_id)

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
                        r.ip_address,
                        r.tenant_id
                    FROM active_sessions AS s
                    JOIN routers AS r ON r.id = s.router_id
                    JOIN payments AS pay ON pay.id = s.payment_id
                    JOIN packages AS p ON p.id = pay.package_id
                    JOIN buyers AS b ON b.id = s.buyer_id
                    WHERE s.status = 'active'
                      AND s.expiration_time > NOW()
                      AND regexp_replace(upper(coalesce(b.buyer_mac, '')), '[^0-9A-F]', '', 'g') = %s
                      {router_filter}
                      {tenant_filter}
                    ORDER BY s.start_time DESC
                    LIMIT 1
                """
                await cursor.execute(query, tuple(params))
                row = await cursor.fetchone()
                if not row:
                    return None

                (
                    db_id,
                    session_identifier,
                    assigned_ip,
                    expiration_time,
                    bytes_uploaded,
                    bytes_downloaded,
                    status,
                    rate_limit,
                    driver_type,
                    radius_secret,
                    nas_identifier,
                    router_ip,
                    found_tenant_id,
                ) = row
                return {
                    "id": db_id,
                    "session_id": session_identifier,
                    "session_identifier": session_identifier,
                    "assigned_ip": assigned_ip,
                    "expiration_time": expiration_time,
                    "bytes_uploaded": bytes_uploaded or 0,
                    "bytes_downloaded": bytes_downloaded or 0,
                    "status": status,
                    "mikrotik_rate_limit": rate_limit,
                    "driver_type": driver_type,
                    "radius_secret": radius_secret,
                    "nas_identifier": nas_identifier,
                    "router_ip": str(router_ip) if router_ip is not None else None,
                    "tenant_id": found_tenant_id,
                }
        finally:
            await conn.close()

    async def authenticate(
        self,
        username: str,
        password: str,
        calling_station_id: Optional[str] = None,
        nas_identifier: Optional[str] = None,
        nas_ip_address: Optional[str] = None,
        framed_ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Return the REST response consumed by FreeRADIUS rlm_rest."""
        mac_address = self._normalize_mac(calling_station_id or username)
        if len(mac_address) != 12:
            return {
                "control:Auth-Type": "Reject",
                "reply:Reply-Message": "Missing or invalid client MAC address.",
            }

        router_id: Optional[int] = None
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                if nas_identifier:
                    await cursor.execute(
                        """
                                                SELECT id
                        FROM routers
                        WHERE driver_type IN ('mikrotik_radius', 'tplink_radius', 'radius_aaa')
                          AND lower(trim(nas_identifier)) = lower(trim(%s))
                        ORDER BY id
                        LIMIT 1
                        """,
                        (str(nas_identifier),),
                    )
                    router_row = await cursor.fetchone()
                    if router_row:
                        router_id = router_row[0]

                # If NAS-Identifier was absent/unmatched, use the NAS source IP
                # only when it uniquely identifies a registered MikroTik router.
                if router_id is None and nas_ip_address:
                    await cursor.execute(
                        """
                        SELECT id
                        FROM routers
                        WHERE driver_type IN ('mikrotik_radius', 'tplink_radius', 'radius_aaa')
                          AND host(ip_address) = host(%s::inet)
                        ORDER BY id
                        LIMIT 2
                        """,
                        (str(nas_ip_address),),
                    )
                    router_rows = await cursor.fetchall()
                    if len(router_rows) == 1:
                        router_id = router_rows[0][0]
        finally:
            await conn.close()

        session = await self.get_active_session_for_mac(
            tenant_id=None,
            mac_address=mac_address,
            router_id=router_id,
        )
        if not session:
            return {
                "control:Auth-Type": "Reject",
                "reply:Reply-Message": (
                    "No active internet session found for this MAC and router. "
                    "Check payment status, MAC address, and NAS-Identifier."
                ),
            }

        remaining_seconds = self._remaining_seconds(session.get("expiration_time"))
        if remaining_seconds <= 0:
            return {
                "control:Auth-Type": "Reject",
                "reply:Reply-Message": "Your internet session has expired.",
            }

        response: Dict[str, Any] = {
            "control:Auth-Type": "Accept",
            "reply:Session-Timeout": remaining_seconds,
            "reply:Reply-Message": "Access granted by NetKitonga.",
        }

        assigned_ip = session.get("assigned_ip")
        if assigned_ip and str(assigned_ip) not in ("0.0.0.0", "0", "None"):
            response["reply:Framed-IP-Address"] = str(assigned_ip)
        if session.get("mikrotik_rate_limit"):
            response["reply:Mikrotik-Rate-Limit"] = str(session["mikrotik_rate_limit"])

        return response

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
        mac_address = self._normalize_mac(calling_station_id or username)
        if len(mac_address) != 12:
            return {"status": "ignored", "message": "Missing or invalid client MAC address."}

        def safe_int(value: Any) -> int:
            try:
                return max(0, int(value or 0))
            except (ValueError, TypeError, OverflowError):
                return 0

        input_octets = safe_int(acct_input_octets)
        output_octets = safe_int(acct_output_octets)
        session_time = safe_int(acct_session_time)
        status_value = str(acct_status_type or "").strip().lower()

        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                params: List[Any] = [mac_address]
                session_filter = ""
                if session_id:
                    session_filter = " AND s.session_id::text = %s"
                    params.append(str(session_id))

                router_filter = ""
                if nas_identifier:
                    router_filter = " AND lower(trim(r.nas_identifier)) = lower(trim(%s))"
                    params.append(str(nas_identifier))

                await cursor.execute(
                    f"""
                    SELECT s.id, s.session_id, s.status
                    FROM active_sessions AS s
                    JOIN buyers AS b ON b.id = s.buyer_id
                    JOIN routers AS r ON r.id = s.router_id
                    WHERE regexp_replace(upper(coalesce(b.buyer_mac, '')), '[^0-9A-F]', '', 'g') = %s
                      {session_filter}
                      {router_filter}
                    ORDER BY s.start_time DESC
                    LIMIT 1
                    """,
                    tuple(params),
                )
                row = await cursor.fetchone()
                if not row:
                    return {"status": "ignored", "message": "No matching session found."}

                db_id, stored_session_id, stored_status = row
                if status_value in ("stop", "accounting-off"):
                    new_status = "terminated"
                else:
                    new_status = stored_status

                await cursor.execute(
                    """
                    UPDATE active_sessions
                    SET bytes_uploaded = %s,
                         bytes_downloaded = %s,
                        status = %s
                    WHERE id = %s
                    """,
                    (input_octets, output_octets, new_status, db_id),
                )
                await conn.commit()
                return {
                    "status": "success",
                    "message": "Accounting information processed successfully.",
                    "session_id": stored_session_id,
                    "session_status": new_status,
                    "acct_status_type": acct_status_type,
                    "acct_input_octets": input_octets,
                    "acct_output_octets": output_octets,
                    "acct_session_time": session_time,
                }
        except Exception:
            await conn.rollback()
            raise
        finally:
            await conn.close()

    @staticmethod
    def build_clients_config(routers: List[Dict[str, Any]]) -> str:
        """Render clients.conf blocks. Keep shared secrets quoted and escape quotes."""
        blocks = []
        for index, router in enumerate(routers, start=1):
            name = re.sub(r"[^A-Za-z0-9_.-]", "_", str(router.get("router_name") or f"mikrotik_{index}"))
            ip_address = str(router.get("ip_address") or "").strip()
            secret = str(router.get("radius_secret") or "")
            if not ip_address or not secret:
                continue
            secret = secret.replace("\\", "\\\\").replace('"', '\\"')
            nas_identifier = str(router.get("nas_identifier") or name).replace('"', '\\"')
            blocks.append(
                f'client {name} {{\n'
                f'    ipaddr = {ip_address}\n'
                f'    secret = "{secret}"\n'
                f'    shortname = {name}\n'
                f'    nas_type = mikrotik\n'
                f'    require_message_authenticator = no\n'
                f'    # NAS-Identifier expected by NetKitonga: {nas_identifier}\n'
                f'}}'
            )
        return "\n\n".join(blocks)

    @staticmethod
    def build_users_config(users: List[Dict[str, Any]]) -> str:
        """Render an optional FreeRADIUS users file snippet for MAC usernames."""
        lines = []
        for user in users:
            mac = FreeRADIUSService._normalize_mac(user.get("mac_address"))
            if len(mac) == 12:
                lines.append(f'"{mac}" Cleartext-Password := "{mac}"')
                lines.append('    Reply-Message = "Use database-backed authorization for live sessions."')
        return "\n".join(lines)
