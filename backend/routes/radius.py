from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from config.db import connection
from services.freeradius import FreeRADIUSService
from utils.mac import normalize_mac

radius_endpoints = APIRouter(tags=["radius"])
freeradius_service = FreeRADIUSService()


def _compact_mac(value: Optional[str]) -> str:
    """Normalize MACs to uppercase hex without separators."""
    return "".join(ch for ch in str(value or "").upper() if ch in "0123456789ABCDEF")


@radius_endpoints.get("/authorize")
async def authorize_radius_session(
    mac: str = Query(..., description="Client MAC address"),
    nas_id: Optional[str] = Query(None, description="NAS identifier / nas_identifier"),
    router_id: Optional[int] = Query(None, description="Router ID if known"),
    ip: Optional[str] = Query(None, description="Client IP address"),
):
    """Authorize a client against an active paid session."""
    compact_mac = _compact_mac(mac)
    if len(compact_mac) != 12:
        raise HTTPException(status_code=400, detail="Invalid client MAC address")

    if not router_id and not nas_id:
        raise HTTPException(status_code=400, detail="router_id or nas_id is required")

    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            router_filter = ""
            params: List[Any] = [compact_mac, ip or "0.0.0.0"]

            if router_id:
                router_filter = "AND r.id = %s"
                params.append(router_id)
            else:
                router_filter = "AND r.nas_identifier = %s"
                params.append(str(nas_id).strip())

            query = f"""
                SELECT
                    s.session_id,
                    s.expiration_time,
                    s.assigned_ip,
                    p.mikrotik_rate_limit
                FROM active_sessions AS s
                JOIN routers AS r ON r.id = s.router_id
                JOIN payments AS pay ON pay.id = s.payment_id
                JOIN packages AS p ON p.id = pay.package_id
                JOIN buyers AS b ON b.id = s.buyer_id
                WHERE s.status = 'active'
                  AND s.expiration_time > NOW()
                  AND r.driver_type = 'mikrotik_radius'
                  AND regexp_replace(upper(coalesce(b.buyer_mac, '')), '[^0-9A-F]', '', 'g') = %s
                  AND (s.assigned_ip = %s OR s.assigned_ip = '0.0.0.0' OR s.assigned_ip IS NULL)
                  {router_filter}
                ORDER BY s.start_time DESC
                LIMIT 1
            """
            await cursor.execute(query, tuple(params))
            row = await cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="No active session")

            session_id, expiration_time, assigned_ip, rate_limit = row
            remaining = freeradius_service._remaining_seconds(expiration_time)
            if remaining <= 0:
                raise HTTPException(status_code=403, detail="Session expired")

            return {
                "access": "accept",
                "session_id": session_id,
                "assigned_ip": assigned_ip or ip or "0.0.0.0",
                # RADIUS Session-Timeout is a duration in seconds, not a Unix timestamp.
                "session_timeout": remaining,
                "mikrotik_rate_limit": rate_limit,
                "reply_message": "Access granted by NetKitonga.",
            }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        await conn.close()


@radius_endpoints.get("/authorize/simple")
async def authorize_radius_session_simple(
    calling_station_id: Optional[str] = Query(None, alias="mac"),
    nas_identifier: Optional[str] = Query(None, alias="nas_id"),
    nas_ip_address: Optional[str] = Query(None, alias="nas_ip"),
    framed_ip_address: Optional[str] = Query(None, alias="ip"),
):
    """FreeRADIUS REST authorization endpoint backed by active_sessions."""
    mac = calling_station_id or ""
    if not _compact_mac(mac):
        raise HTTPException(status_code=400, detail="Missing calling_station_id or mac")

    return await freeradius_service.authenticate(
        username=normalize_mac(mac),
        password=normalize_mac(mac),
        calling_station_id=mac,
        nas_identifier=nas_identifier,
        nas_ip_address=nas_ip_address,
        framed_ip_address=framed_ip_address,
    )


@radius_endpoints.post("/accounting")
async def radius_accounting(payload: Dict[str, Any]):
    """Receive RADIUS accounting updates and update the matching active session."""
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid accounting payload")

    mac = payload.get("calling_station_id") or payload.get("mac") or payload.get("username")
    if not _compact_mac(str(mac or "")):
        raise HTTPException(status_code=400, detail="Missing calling_station_id or username")

    return await freeradius_service.accounting(
        username=normalize_mac(str(mac)),
        calling_station_id=payload.get("calling_station_id") or payload.get("mac"),
        nas_identifier=payload.get("nas_identifier") or payload.get("nas_id"),
        session_id=payload.get("session_id"),
        framed_ip_address=payload.get("framed_ip_address") or payload.get("ip"),
        acct_status_type=payload.get("acct_status_type"),
        acct_input_octets=payload.get("acct_input_octets"),
        acct_output_octets=payload.get("acct_output_octets"),
        acct_session_time=payload.get("acct_session_time"),
        event_timestamp=payload.get("event_timestamp"),
    )


@radius_endpoints.get("/config/clients")
async def get_freeradius_clients(tenant_id: Optional[int] = Query(None)):
    """Return generated FreeRADIUS client blocks for registered MikroTik routers."""
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            query = """
                SELECT router_name, ip_address, nas_identifier, radius_secret
                FROM routers
                WHERE driver_type = 'mikrotik_radius'
                  AND ip_address IS NOT NULL
                  AND radius_secret IS NOT NULL
            """
            params: List[Any] = []
            if tenant_id is not None:
                query += " AND tenant_id = %s"
                params.append(tenant_id)
            query += " ORDER BY id"

            await cursor.execute(query, tuple(params))
            rows = await cursor.fetchall()
            routers = [
                {
                    "router_name": row[0],
                    "ip_address": str(row[1]),
                    "nas_identifier": row[2],
                    "radius_secret": row[3],
                }
                for row in rows
            ]
            return {
                "tenant_id": tenant_id,
                "clients": routers,
                "config": freeradius_service.build_clients_config(routers),
            }
    finally:
        await conn.close()


@radius_endpoints.get("/config/users")
async def get_freeradius_users(tenant_id: Optional[int] = Query(None)):
    """Return optional static users text; live authorization remains database-backed."""
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            query = """
                SELECT DISTINCT b.buyer_mac
                FROM buyers AS b
                JOIN active_sessions AS s ON s.buyer_id = b.id
                JOIN routers AS r ON r.id = s.router_id
                WHERE s.status = 'active'
                  AND s.expiration_time > NOW()
                  AND r.driver_type = 'mikrotik_radius'
                  AND b.buyer_mac IS NOT NULL
            """
            params: List[Any] = []
            if tenant_id is not None:
                query += " AND b.tenant_id = %s"
                params.append(tenant_id)
            query += " ORDER BY b.buyer_mac"

            await cursor.execute(query, tuple(params))
            users = [{"mac_address": row[0]} for row in await cursor.fetchall()]
            return {
                "tenant_id": tenant_id,
                "users": users,
                "config": freeradius_service.build_users_config(users),
            }
    finally:
        await conn.close()
