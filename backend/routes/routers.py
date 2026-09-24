from fastapi import APIRouter, status, Query, HTTPException, Depends
from fastapi.responses import PlainTextResponse, RedirectResponse
from typing import Dict, Any, Optional
from models.routers import RouterRegister, RouterUpdate, RouterDelete, RouterResponse
from controllers.routers import RouterController
from config.db import connection

FRONTEND_URL = "https://net-kitonga.vercel.app"

# Router CRUD/monitoring telemetry sub-router
router = APIRouter()
controller = RouterController()

# WiFiDog captive-portal sub-router

wifidog_router = APIRouter()

@router.get("/lookup", response_model=Dict[str, Any])
async def handle_router_lookup(ip_address: str = Query(..., description="Router IP address for automatic lookup")):
    return await controller.lookup_router_by_ip(ip_address)

@router.get("/resolve", response_model=Dict[str, Any])
async def handle_router_resolve(ip_address: str = Query(..., description="Client or router IP to resolve tenant, branch, and router details")):
    router_info = await controller.lookup_router_by_ip(ip_address)
    if not router_info:
        raise HTTPException(status_code=404, detail="Router profile not found for the provided IP address.")
    return {
        "router_id": router_info["id"],
        "tenant_id": router_info["tenant_id"],
        "branch_id": router_info.get("branch_id"),
    }

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
    return PlainTextResponse("Pong")


# =====================================================================
#  SECTION 4: WIFIDOG CAPTIVE PORTAL ENDPOINTS
# =====================================================================

@wifidog_router.get("/ping")
async def wifidog_ping():
    return PlainTextResponse("Pong")


@wifidog_router.get("/auth")
async def wifidog_auth(
    gw_id: Optional[str] = Query(None),
    mac: Optional[str] = Query(None),
    ip: Optional[str] = Query(None),
    url: Optional[str] = Query(None),
):
    client_mac = mac
    if not gw_id or not client_mac:
        return PlainTextResponse("Auth: 0")

    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT id FROM routers WHERE gw_id = %s;", (gw_id,))
            router_row = await cursor.fetchone()
            if not router_row:
                return PlainTextResponse("Auth: 0")

            router_id = router_row[0]

            await cursor.execute("SELECT id FROM buyers WHERE buyer_mac = %s;", (client_mac,))
            buyer_row = await cursor.fetchone()
            if not buyer_row:
                return PlainTextResponse("Auth: 0")

            buyer_id = buyer_row[0]

            if ip:
                await cursor.execute(
                    """
                    SELECT id FROM active_sessions
                    WHERE router_id = %s AND buyer_id = %s AND assigned_ip = %s AND status = 'active'
                    AND expiration_time > NOW();
                    """,
                    (router_id, buyer_id, ip),
                )
                session = await cursor.fetchone()
                if session:
                    return PlainTextResponse("Auth: 1")

            await cursor.execute(
                """
                SELECT id FROM active_sessions
                WHERE router_id = %s AND buyer_id = %s AND status = 'active'
                AND expiration_time > NOW();
                """,
                (router_id, buyer_id),
            )
            session = await cursor.fetchone()
            if session:
                return PlainTextResponse("Auth: 1")

            return PlainTextResponse("Auth: 0")
    finally:
        await conn.close()


@wifidog_router.get("/login")
async def wifidog_login(
    gw_id: Optional[str] = Query(None),
    mac: Optional[str] = Query(None),
    ip: Optional[str] = Query(None),
    url: Optional[str] = Query(None),
):
    params = []
    if gw_id:
        params.append(f"gw_id={gw_id}")
    if mac:
        params.append(f"mac={mac}")
    if ip:
        params.append(f"ip={ip}")
    if url:
        params.append(f"url={url}")
    query = f"?{'&'.join(params)}" if params else ""
    return RedirectResponse(url=f"{FRONTEND_URL}/portal{query}", status_code=302)


@wifidog_router.get("/portal")
async def wifidog_portal(
    gw_id: Optional[str] = Query(None),
    mac: Optional[str] = Query(None),
    ip: Optional[str] = Query(None),
    url: Optional[str] = Query(None),
):
    params = []
    if gw_id:
        params.append(f"gw_id={gw_id}")
    if mac:
        params.append(f"mac={mac}")
    if ip:
        params.append(f"ip={ip}")
    if url:
        params.append(f"url={url}")
    query = f"?{'&'.join(params)}" if params else ""
    return RedirectResponse(url=f"{FRONTEND_URL}/portal{query}", status_code=302)


@wifidog_router.get("/msg")
async def wifidog_msg(message: str = Query("Welcome")):
    return PlainTextResponse(f"Message: {message}")


@wifidog_router.get("/register")
async def wifidog_register():
    return PlainTextResponse("OK")

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
