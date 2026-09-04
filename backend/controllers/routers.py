import os
from datetime import datetime
from typing import Dict, Any
from fastapi import HTTPException, status
from config.db import connection
from models.routers import RouterRegister, RouterUpdate, RouterDelete, RouterResponse
from services.routers import RouterService

class RouterController:
    def __init__(self):
        self.router_service = RouterService()
    
    async def register_router(self, router_data: RouterRegister) -> Dict[str, Any]:
        """
        Catches form inputs, saves the physical network parameters to PostgreSQL, 
        and outputs the dynamic copy-paste setup configuration scripts.
        """
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                # 1. Execute safe parameterized query to insert hardware data
                query = """
                    INSERT INTO routers (
                        tenant_id, branch_id, router_name, driver_type, 
                        nas_identifier, radius_secret, gw_id, mac_address, 
                        is_licensed, status, last_heartbeat_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                    RETURNING id;
                """
                
                params = (
                    router_data.tenant_id,
                    router_data.branch_id,
                    router_data.router_name,
                    router_data.driver_type,
                    router_data.nas_identifier if router_data.driver_type == "mikrotik_radius" else None,
                    router_data.radius_secret if router_data.driver_type == "mikrotik_radius" else None,
                    router_data.gw_id if router_data.driver_type == "ruijie_wifidog" else None,
                    router_data.mac_address,
                    router_data.is_licensed,
                    router_data.status,
                    router_data.last_heartbeat_at
                )
                
                await cursor.execute(query, params)
                new_id_row = await cursor.fetchone()
                
                if not new_id_row:
                    raise HTTPException(status_code=500, detail="Database write operation failed.")
                
                new_router_id = new_id_row[0]
                await conn.commit()
                
                # 2. Trigger outbound service to compile the device-specific hardware setup blocks
                router_payload = await self.router_service.router_connection(
                    tenant_id=router_data.tenant_id,
                    branch_id=router_data.branch_id,
                    router_name=router_data.router_name,
                    driver_type=router_data.driver_type,
                    nas_identifier=router_data.nas_identifier,
                    radius_secret=router_data.radius_secret,
                    gw_id=router_data.gw_id,
                    mac_address=router_data.mac_address,
                    is_licensed=router_data.is_licensed,
                    status=router_data.status,
                    last_heartbeat_at=router_data.last_heartbeat_at
                )
                
                # 3. Combine response metadata to return to the user interface
                return {
                    "message": "Router registered successfully in the billing backend system.",
                    "router_id": new_router_id,
                    "configuration": router_payload
                }
                
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=400, detail=f"Database constraint error: {str(e)}")
        finally:
            await conn.close()

    async def update_router(self, router_data: RouterUpdate) -> RouterResponse:
        """Processes form modifications for existing branches dynamically."""
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                # Update baseline layout elements securely using dynamic updates
                query = """
                    UPDATE routers SET 
                        router_name = COALESCE(%s, router_name),
                        driver_type = COALESCE(%s, driver_type),
                        nas_identifier = COALESCE(%s, nas_identifier),
                        radius_secret = COALESCE(%s, radius_secret),
                        gw_id = COALESCE(%s, gw_id),
                        mac_address = COALESCE(%s, mac_address),
                        is_licensed = COALESCE(%s, is_licensed),
                        status = COALESCE(%s, status)
                    WHERE id = %s RETURNING id, status;
                """
                params = (
                    router_data.router_name, router_data.driver_type,
                    router_data.nas_identifier, router_data.radius_secret,
                    router_data.gw_id, router_data.mac_address,
                    router_data.is_licensed, router_data.status,
                    router_data.router_id
                )
                await cursor.execute(query, params)
                updated_row = await cursor.fetchone()
                
                if not updated_row:
                    raise HTTPException(status_code=404, detail="Target router ID matching parameters not found.")
                
                await conn.commit()
                return RouterResponse(
                    message="Router configuration values updated seamlessly.",
                    router_id=updated_row[0],
                    status=updated_row[1]
                )
        finally:
            await conn.close()

    async def delete_router(self, router_data: RouterDelete) -> RouterResponse:
        """Purges hardware records from the central pipeline registry cleanly."""
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = "DELETE FROM routers WHERE id = %s RETURNING id;"
                await cursor.execute(query, (router_data.router_id,))
                deleted_row = await cursor.fetchone()
                
                if not deleted_row:
                    raise HTTPException(status_code=404, detail="Router ID does not exist in the database instance.")
                
                await conn.commit()
                return RouterResponse(
                    message="Router record removed from the multi-tenant scope.",
                    router_id=deleted_row[0],
                    status="deleted"
                )
        finally:
            await conn.close()

    async def get_device_status(self, router_id: int) -> dict:
        """
        Fetches the current live status and last seen timestamp of a single router.
        Automatically applies a 120-second timeout check to flip dead connections to offline.
        """
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                # 1. Fetch current device data from PostgreSQL
                query = "SELECT id, router_name, status, last_heartbeat_at FROM routers WHERE id = %s;"
                await cursor.execute(query, (router_id,))
                router = await cursor.fetchone()
                
                if not router:
                    raise HTTPException(status_code=404, detail="Router profile not found.")
                
                router_id_val, name, current_status, last_heartbeat = router
                
                # 2. Check for connection timeout (120 seconds)
                if current_status == "online" and last_heartbeat:
                    time_delta = (datetime.utcnow() - last_heartbeat).total_seconds()
                    
                    if time_delta > 120:
                        current_status = "offline"
                        update_query = "UPDATE routers SET status = 'offline' WHERE id = %s;"
                        await cursor.execute(update_query, (router_id_val,))
                        await conn.commit()

                return {
                    "router_id": router_id_val,
                    "router_name": name,
                    "status": current_status,
                    "last_heartbeat": last_heartbeat.isoformat() if last_heartbeat else None
                }
        finally:
            await conn.close()

    async def list_routers(self, tenant_id: int) -> dict:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, router_name, driver_type, nas_identifier, radius_secret, gw_id, mac_address, is_licensed, status, last_heartbeat_at FROM routers WHERE tenant_id = %s ORDER BY id",
                    (tenant_id,)
                )
                routers = await cursor.fetchall()
                cols = [d[0] for d in (cursor.description or [])]
                return {"routers": [dict(zip(cols, r)) for r in routers]}
        finally:
            await conn.close()

    async def process_device_heartbeat(self, identifier: str, driver_protocol: str) -> dict:
        """
        Receives real-time outbound pings from physical routers across the internet.
        Locates the device row and refreshes its live timestamp state.
        """
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                if driver_protocol == "ruijie_wifidog":
                    query = "SELECT id FROM routers WHERE gw_id = %s;"
                else:
                    query = "SELECT id FROM routers WHERE nas_identifier = %s;"

                await cursor.execute(query, (identifier,))
                router_row = await cursor.fetchone()

                if not router_row:
                    raise HTTPException(status_code=404, detail="Router identifier not found.")

                router_id = router_row[0]
                await cursor.execute(
                    "UPDATE routers SET last_heartbeat_at = %s, status = 'online' WHERE id = %s;",
                    (datetime.utcnow(), router_id)
                )
                await conn.commit()
                return {"message": "Heartbeat received", "router_id": router_id, "status": "online"}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Heartbeat error: {str(e)}")
        finally:
            await conn.close()