from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from config.db import connection
from utils.mac import normalize_mac

radius_endpoints = APIRouter(tags=["radius"])

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
            params = [normalized_mac, ip or "0.0.0.0"]

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
