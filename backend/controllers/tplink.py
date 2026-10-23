from datetime import datetime
from typing import Dict, Any
from fastapi import HTTPException
from config.db import connection
from models.tplink import TplinkRegister, TplinkUpdate, TplinkDelete, TplinkResponse
from services.tplink import TplinkService


class TplinkController:
    def __init__(self):
        self.tplink_service = TplinkService()

    async def register_tplink(self, data: TplinkRegister) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = """
                    INSERT INTO tplink (
                        tenant_id, branch_id, router_id, device_name, mac_address,
                        ip_address, nas_identifier, radius_secret, portal_url,
                        status, last_heartbeat_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id;
                """
                params = (
                    data.tenant_id,
                    data.branch_id,
                    data.router_id,
                    data.device_name,
                    data.mac_address,
                    str(data.ip_address),
                    data.nas_identifier,
                    data.radius_secret,
                    data.portal_url,
                    data.status,
                    data.last_heartbeat_at,
                )
                await cursor.execute(query, params)
                row = await cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=500, detail="Database write operation failed.")
                new_id = row[0]

                # Keep the linked router in sync so RADIUS auth/accounting
                # and payments/vouchers continue to work through it.
                await cursor.execute(
                    """
                    UPDATE routers
                    SET nas_identifier = COALESCE(%s, nas_identifier),
                        radius_secret = COALESCE(%s, radius_secret),
                        driver_type = 'tplink_radius'
                    WHERE id = %s;
                    """,
                    (data.nas_identifier, data.radius_secret, data.router_id),
                )
                await conn.commit()

                config = self.tplink_service.build_config(
                    device_name=data.device_name,
                    ip_address=str(data.ip_address),
                    nas_identifier=data.nas_identifier or data.device_name,
                    radius_secret=data.radius_secret or "",
                    portal_url=data.portal_url or "",
                    router_id=data.router_id,
                )

                return {
                    "message": "TP-Link device registered successfully.",
                    "tplink_id": new_id,
                    "configuration": config,
                }
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=400, detail=f"Database constraint error: {str(e)}")
        finally:
            await conn.close()

    async def update_tplink(self, data: TplinkUpdate) -> TplinkResponse:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = """
                    UPDATE tplink SET
                        device_name = COALESCE(%s, device_name),
                        branch_id = COALESCE(%s, branch_id),
                        router_id = COALESCE(%s, router_id),
                        mac_address = COALESCE(%s, mac_address),
                        ip_address = COALESCE(%s, ip_address),
                        nas_identifier = COALESCE(%s, nas_identifier),
                        radius_secret = COALESCE(%s, radius_secret),
                        portal_url = COALESCE(%s, portal_url),
                        status = COALESCE(%s, status),
                        last_heartbeat_at = COALESCE(%s, last_heartbeat_at)
                    WHERE id = %s RETURNING id, status;
                """
                params = (
                    data.device_name,
                    data.branch_id,
                    data.router_id,
                    data.mac_address,
                    str(data.ip_address) if data.ip_address else None,
                    data.nas_identifier,
                    data.radius_secret,
                    data.portal_url,
                    data.status,
                    data.last_heartbeat_at,
                    data.tplink_id,
                )
                await cursor.execute(query, params)
                row = await cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="TP-Link device not found.")

                target_router_id = data.router_id
                if target_router_id is None:
                    await cursor.execute("SELECT router_id FROM tplink WHERE id = %s;", (data.tplink_id,))
                    r = await cursor.fetchone()
                    if r:
                        target_router_id = r[0]

                if target_router_id is not None and (data.nas_identifier is not None or data.radius_secret is not None):
                    await cursor.execute(
                        """
                        UPDATE routers
                        SET nas_identifier = COALESCE(%s, nas_identifier),
                            radius_secret = COALESCE(%s, radius_secret),
                            driver_type = 'tplink_radius'
                        WHERE id = %s;
                        """,
                        (data.nas_identifier, data.radius_secret, target_router_id),
                    )

                await conn.commit()
                return TplinkResponse(message="TP-Link device updated successfully.", tplink_id=row[0], status=row[1])
        finally:
            await conn.close()

    async def delete_tplink(self, data: TplinkDelete) -> TplinkResponse:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM tplink WHERE id = %s RETURNING id;", (data.tplink_id,))
                row = await cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="TP-Link device not found.")
                await conn.commit()
                return TplinkResponse(message="TP-Link device removed successfully.", tplink_id=row[0], status="deleted")
        finally:
            await conn.close()

    async def list_tplink(self, tenant_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT t.id, t.tenant_id, t.branch_id, b.branch_name, t.router_id,
                           r.router_name, r.status AS router_status, t.device_name, t.mac_address,
                           t.ip_address, t.nas_identifier, t.radius_secret, t.portal_url,
                           t.status, t.last_heartbeat_at
                    FROM tplink t
                    LEFT JOIN branches b ON b.id = t.branch_id
                    LEFT JOIN routers r ON r.id = t.router_id
                    WHERE t.tenant_id = %s
                    ORDER BY t.id
                    """,
                    (tenant_id,),
                )
                rows = await cursor.fetchall()
                cols = [d[0] for d in (cursor.description or [])]
                items = []
                for r in rows:
                    d = dict(zip(cols, r))
                    if d.get("router_status"):
                        d["status"] = d["router_status"]
                    items.append(d)
                return {"devices": items}
        finally:
            await conn.close()

    async def get_status(self, tplink_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT t.id, t.device_name, COALESCE(r.status, t.status) AS status, t.last_heartbeat_at
                    FROM tplink t
                    LEFT JOIN routers r ON r.id = t.router_id
                    WHERE t.id = %s
                    """,
                    (tplink_id,),
                )
                row = await cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="TP-Link device not found.")
                return {
                    "tplink_id": row[0],
                    "device_name": row[1],
                    "status": row[2],
                    "last_heartbeat": row[3].isoformat() if row[3] else None,
                }
        finally:
            await conn.close()
