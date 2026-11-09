from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from config.db import connection
from models.sessions import SessionResponse, SessionTerminate
from services.omada import OmadaConfigurationError, OmadaControllerError
from services.omada_sessions import terminate_session as terminate_active_session
from utils.subscription_access import require_active_subscription

session_endpoints = APIRouter(
    prefix="/sessions",
    tags=["sessions"],
    dependencies=[Depends(require_active_subscription)],
)

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
    try:
        terminated = await terminate_active_session(
            payload.session_id,
            tenant_id=payload.tenant_id,
        )
    except (OmadaConfigurationError, OmadaControllerError) as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "The session was terminated in NetKitonga, but Omada could not "
                f"disconnect the client: {exc}"
            ),
        ) from exc

    if not terminated:
        raise HTTPException(status_code=404, detail="Active session not found.")
    return {"message": "Session terminated successfully."}
