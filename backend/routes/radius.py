from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query
from config.db import connection
from utils.mac import normalize_mac
from services.freeradius import FreeRADIUSService

radius_endpoints = APIRouter(tags=["radius"])
freeradius_service = FreeRADIUSService()


@radius_endpoints.get("/authorize")
async def authorize_radius_session(
    mac: str = Query(..., description="Client MAC address"),
    nas_id: Optional[str] = Query(None, description="NAS identifier / nas_identifier"),
    router_id: Optional[int] = Query(None, description="Router ID if known"),
    ip: Optional[str] = Query(None, description="Client IP address"),
):
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            normalized_mac = normalize_mac(mac)
            router_filter = ""
            params: List[Any] = [normalized_mac, ip or "0.0.0.0"]

            if router_id:
                router_filter = "AND r.id = %s"
                params.append(router_id)
            elif nas_id:
                router_filter = "AND r.nas_identifier = %s"
                params.append(nas_id)
            else:
                raise HTTPException(status_code=400, detail="router_id or nas_id is required")

            query = f"""
                SELECT s.session_id, s.expiration_time, s.assigned_ip,
                       p.mikrotik_rate_limit
                FROM active_sessions s
                JOIN routers r ON r.id = s.router_id
                JOIN payments pay ON pay.id = s.payment_id
                JOIN packages p ON p.id = pay.package_id
                JOIN buyers b ON b.id = s.buyer_id
                WHERE s.status = 'active'
                  AND s.expiration_time > NOW()
                  AND r.driver_type = 'mikrotik_radius'
                  AND b.buyer_mac = %s
                  AND (
                      s.assigned_ip = %s
                      OR s.assigned_ip = '0.0.0.0'
                  )
                  {router_filter}
                ORDER BY s.start_time DESC
                LIMIT 1;
            """
            await cursor.execute(query, tuple(params))
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="No active session")

            session_id, expiration_time, assigned_ip, mikrotik_rate_limit = row

            import secrets
            reply_message = secrets.token_hex(4)

            return {
                "access": "accept",
                "session_id": session_id,
                "assigned_ip": assigned_ip or ip or "0.0.0.0",
                "session_timeout": int(expiration_time.timestamp()) if expiration_time else None,
                "mikrotik_rate_limit": mikrotik_rate_limit,
                "reply_message": reply_message,
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        await conn.close()


@radius_endpoints.get("/authorize/simple")
async def authorize_radius_session_simple(
    calling_station_id: Optional[str] = Query(None, alias="mac"),
    nas_identifier: Optional[str] = Query(None, alias="nas_id"),
    nas_ip_address: Optional[str] = Query(None, alias="nas_ip"),
    framed_ip_address: Optional[str] = Query(None, alias="ip"),
):
    """
    Generic RADIUS authorization entrypoint for FreeRADIUS-style proxies.

    Uses the billing backend's active_sessions as the source of truth.
    Returns a JSON payload compatible with FreeRADIUS rlm_rest-style responses.
    """
    username = normalize_mac(str(calling_station_id or ""))
    if not username:
        raise HTTPException(status_code=400, detail="Missing calling_station_id or mac")

    result = await freeradius_service.authenticate(
        username=username,
        password=username,
        calling_station_id=calling_station_id,
        nas_identifier=nas_identifier,
        nas_ip_address=nas_ip_address,
        framed_ip_address=framed_ip_address,
    )
    return result


@radius_endpoints.post("/accounting")
async def radius_accounting(payload: Dict[str, Any]):
    """
    Generic RADIUS accounting entrypoint.

    Accepts a JSON body with common RADIUS accounting attributes:
    - calling_station_id / mac
    - nas_identifier
    - session_id
    - framed_ip_address
    - acct_status_type
    - acct_input_octets / acct_output_octets
    - acct_session_time
    - event_timestamp
    """
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid accounting payload.")

    username = normalize_mac(str(payload.get("calling_station_id") or payload.get("username") or ""))
    if not username:
        raise HTTPException(status_code=400, detail="Missing calling_station_id or username.")

    result = await freeradius_service.accounting(
        username=username,
        calling_station_id=payload.get("calling_station_id"),
        nas_identifier=payload.get("nas_identifier"),
        session_id=payload.get("session_id"),
        framed_ip_address=payload.get("framed_ip_address"),
        acct_status_type=payload.get("acct_status_type"),
        acct_input_octets=payload.get("acct_input_octets"),
        acct_output_octets=payload.get("acct_output_octets"),
        acct_session_time=payload.get("acct_session_time"),
        event_timestamp=payload.get("event_timestamp"),
    )
    return result


@radius_endpoints.get("/config/clients")
async def get_freeradius_clients(tenant_id: Optional[int] = Query(None)):
    """
    Return a FreeRADIUS clients.conf-style block for the current tenant.
    If tenant_id is omitted, returns all routers with mikrotik_radius driver.
    """
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            query = """
                SELECT router_name, ip_address, nas_identifier, radius_secret
                FROM routers
                WHERE driver_type = 'mikrotik_radius'
            """
            params: List[Any] = []
            if tenant_id:
                query += " AND tenant_id = %s"
                params.append(tenant_id)

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
    """
    Return a FreeRADIUS users-style block for devices in this tenant.
    This is optional: the main source of truth is the active_sessions table.
    """
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            query = """
                SELECT DISTINCT b.buyer_mac
                FROM buyers b
                JOIN active_sessions s ON s.buyer_id = b.id
                WHERE s.status = 'active'
                  AND s.expiration_time > NOW()
            """
            params: List[Any] = []
            if tenant_id:
                query += " AND b.tenant_id = %s"
                params.append(tenant_id)

            await cursor.execute(query, tuple(params))
            rows = await cursor.fetchall()
            users = [{"mac_address": row[0]} for row in rows]
            return {
                "tenant_id": tenant_id,
                "users": users,
                "config": freeradius_service.build_users_config(users),
            }
    finally:
        await conn.close()

