from fastapi import APIRouter, status, Query, HTTPException, Depends
from fastapi.responses import PlainTextResponse
from typing import Dict, Any
from models.routers import RouterRegister, RouterUpdate, RouterDelete, RouterResponse
from controllers.routers import RouterController

# Instantiate standard endpoint mapping wrappers
router = APIRouter()
controller = RouterController()

# =====================================================================
#  SECTION 1: DASHBOARD CRUD OPERATION PATHS (Frontend Form Handling)
# =====================================================================

@router.get("/", response_model=Dict[str, Any])
async def handle_router_listing(tenant_id: int = Query(..., description="The tenant owning the routers")):
    return await controller.list_routers(tenant_id)

@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def handle_router_registration(router_data: RouterRegister):
    """Processes user form request schemas to provision hardware nodes."""
    return await controller.register_router(router_data)

@router.put("/update", response_model=RouterResponse)
async def handle_router_modifications(router_data: RouterUpdate):
    """Processes pipeline data alterations for network devices."""
    return await controller.update_router(router_data)

@router.delete("/delete", response_model=RouterResponse)
async def handle_router_removal(router_data: RouterDelete):
    """Purges target interface entries safely out of PostgreSQL storage blocks."""
    return await controller.delete_router(router_data)

# =====================================================================
#  SECTION 2: DASHBOARD MONITORING PATH (Status Check Enforced by Model)
# =====================================================================

@router.get("/status", response_model=RouterResponse)
async def handle_get_device_status(router_id: int = Query(..., description="The unique ID of the router")):
    """
    Exposes a validated status query endpoint for the frontend dashboard interface.
    Flipped to 'offline' automatically if its heartbeat has flatlined over 120s.
    """
    return await controller.get_device_status(router_id)

# =====================================================================
#  SECTION 3: OUTBOUND HARDWARE BACKGROUND TELEMETRY LOOPS (The Handshake)
# =====================================================================

@router.get("/wifidog/ping")
async def handle_wifidog_ping(gw_id: str = Query(..., description="Unique Gateway ID")):
    """
    1. AUTOMATIC WIFIDOG HEARTBEAT
    Fired automatically every 60 seconds by Ruijie/OpenWrt hardware.
    """
    success = await controller.process_device_heartbeat(gw_id, "wifidog_http")
    if not success:
        return PlainTextResponse("Auth: 0\n", status_code=404)
    # Wifidog daemon protocol expects plain text 'Png' or 'Pong' response string
    return PlainTextResponse("Pong")

@router.get("/mikrotik/ping")
async def handle_mikrotik_ping(nas_id: str = Query(..., description="MikroTik NAS Identifier")):
    """
    2. AUTOMATIC MIKROTIK HEARTBEAT
    Fired by the script scheduler running inside the RouterOS console.
    """
    success = await controller.process_device_heartbeat(nas_id, "radius_aaa")
    if not success:
        raise HTTPException(status_code=404, detail="Unknown hardware profile footprint.")
    return {"status": "synchronized", "state": "active"}
