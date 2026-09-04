from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from config.db import connection
from models.sessions import SessionResponse, SessionTerminate

session_endpoints = APIRouter(prefix="/sessions", tags=["sessions"])

@session_endpoints.get("/active", response_model=List[SessionResponse])
async def list_active_sessions(tenant_id: int):
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                SELECT s.id, s.session_id, s.router_id, r.router_name,
                       s.buyer_id, b.buyer_mac, s.assigned_ip,
                       s.bytes_uploaded, s.bytes_downloaded, s.start_time,
                       s.expiration_time, s.status
                FROM active_sessions s
                JOIN buyers b ON b.id = s.buyer_id
                LEFT JOIN routers r ON r.id = s.router_id
                WHERE s.tenant_id = %s AND s.status = 'active'
                ORDER BY s.start_time DESC
            """, (tenant_id,))
            rows = await cursor.fetchall()
            fields = ("id", "session_id", "router_id", "router_name", "buyer_id", "buyer_mac", "assigned_ip", "bytes_uploaded", "bytes_downloaded", "start_time", "expiration_time", "status")
            return [dict(zip(fields, row)) for row in rows]
    finally:
        await conn.close()

@session_endpoints.post("/terminate", response_model=Dict[str, str])
async def terminate_session(payload: SessionTerminate):
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("""
                UPDATE active_sessions
                SET status = 'terminated'
                WHERE tenant_id = %s AND session_id = %s AND status = 'active'
                RETURNING session_id
            """, (payload.tenant_id, payload.session_id))
            if not await cursor.fetchone():
                raise HTTPException(status_code=404, detail="Active session not found.")
            await conn.commit()
            return {"message": "Session terminated successfully."}
    except Exception:
        await conn.rollback()
        raise
    finally:
        await conn.close()
