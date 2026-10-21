import os
from urllib.parse import quote
from fastapi import APIRouter, status, Query, HTTPException, Depends
from fastapi.responses import PlainTextResponse, RedirectResponse
from typing import Dict, Any, Optional
from models.routers import RouterRegister, RouterUpdate, RouterDelete, RouterResponse
from controllers.routers import RouterController
from config.db import connection
from utils.mac import normalize_mac

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://netkitonga.com")

# Router CRUD/monitoring telemetry sub-router
router = APIRouter()
controller = RouterController()

# WiFiDog captive-portal sub-router

wifidog_router = APIRouter()

@router.get("/lookup", response_model=Dict[str, Any])
async def handle_router_lookup(ip_address: str = Query(..., description="Router IP address for automatic lookup")):
    return await controller.lookup_router_by_ip(ip_address)

@router.get("/resolve", response_model=Dict[str, Any])
async def handle_router_resolve(
    ip_address: Optional[str] = Query(None, description="Client or router IP address"),
    nas_id: Optional[str] = Query(None, description="MikroTik NAS identifier"),
    gw_id: Optional[str] = Query(None, description="WiFiDog/OpenWrt gateway ID"),
):
    if gw_id:
        return await controller.resolve_router_by_gw_id(gw_id)
    if nas_id:
        return await controller.resolve_router_by_nas_identifier(nas_id)
    if ip_address:
        return await controller.resolve_router_by_ip(ip_address)
    raise HTTPException(status_code=400, detail="ip_address, nas_id, or gw_id is required.")

# =====================================================================
#  SECTION 1: DASHBOARD CRUD OPERATION PATHS (Frontend Form Handling)
# =====================================================================

@router.get("")
async def handle_router_listing(tenant_id: int = Query(..., description="The tenant owning the routers")):
    return await controller.list_routers(tenant_id)

@router.get("/")
async def handle_router_listing_slash(tenant_id: int = Query(..., description="The tenant owning the routers")):
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

@router.get("/status/")
async def handle_get_device_status_slash(router_id: int = Query(..., description="The unique ID of the router")):
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
async def wifidog_ping(
    gw_id: Optional[str] = Query(None, description="WiFiDog gateway ID"),
    sys_uptime: Optional[str] = Query(None),
    sys_memfree: Optional[str] = Query(None),
    sys_load: Optional[str] = Query(None),
    wifidog_uptime: Optional[str] = Query(None),
):
    """
    WiFiDog heartbeat.

    The gateway calls this every 60 seconds against the auth server
    (netkitonga.com/wifidog/ping?gw_id=...). The gateway must always
    receive the literal "Pong", so heartbeat bookkeeping failures must
    never break the response.
    """
    if gw_id:
        try:
            await controller.process_device_heartbeat(gw_id, "wifidog_http")
        except HTTPException:
            pass
        except Exception:
            pass

    return PlainTextResponse("Pong")


@wifidog_router.get("/auth")
async def wifidog_auth(
    gw_id: Optional[str] = Query(None),
    mac: Optional[str] = Query(None),
    ip: Optional[str] = Query(None),
    url: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
):
    """WiFiDog auth-server callback.

    For stage=login, validate the token created during voucher/payment
    activation against an unexpired active session. For normal gateway
    auth checks, preserve the existing MAC/IP session lookup.
    """
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            # WiFiDog gateway callback after the user completes portal login.
            if stage == "login":
                if not token or not gw_id:
                    return PlainTextResponse("Auth: 0")

                normalized_mac = normalize_mac(mac) if mac else None
                await cursor.execute(
                    """
                    SELECT s.id
                    FROM active_sessions AS s
                    JOIN payments AS p ON p.id = s.payment_id
                    JOIN routers AS r ON r.id = s.router_id
                    JOIN buyers AS b ON b.id = s.buyer_id
                    WHERE p.auth_token = %s
                      AND LOWER(TRIM(r.gw_id)) = LOWER(TRIM(%s))
                      AND s.status = 'active'
                      AND s.expiration_time > NOW()
                      AND (%s::text IS NULL OR UPPER(b.buyer_mac) = UPPER(%s))
                      AND (
                          %s::text IS NULL
                          OR s.assigned_ip = %s
                          OR s.assigned_ip = '0.0.0.0'
                      )
                    LIMIT 1;
                    """,
                    (
                        token,
                        gw_id,
                        normalized_mac,
                        normalized_mac,
                        ip,
                        ip,
                    ),
                )
                if await cursor.fetchone():
                    return PlainTextResponse("Auth: 1")
                return PlainTextResponse("Auth: 0")

            # Standard WiFiDog status check by gateway ID and client MAC.
            if not gw_id or not mac:
                return PlainTextResponse("Auth: 0")

            await cursor.execute(
                """
                SELECT id, tenant_id
                FROM routers
                WHERE gw_id IS NOT NULL
                  AND LOWER(TRIM(gw_id)) = LOWER(TRIM(%s))
                ORDER BY id
                LIMIT 1;
                """,
                (str(gw_id).strip(),),
            )
            router_row = await cursor.fetchone()
            if not router_row:
                return PlainTextResponse("Auth: 0")

            router_id, router_tenant_id = router_row
            normalized_mac = normalize_mac(mac)
            if not normalized_mac:
                return PlainTextResponse("Auth: 0")

            # Scope MAC lookup to this router's tenant.
            await cursor.execute(
                """
                SELECT id
                FROM buyers
                WHERE tenant_id = %s AND UPPER(buyer_mac) = UPPER(%s)
                LIMIT 1;
                """,
                (router_tenant_id, normalized_mac),
            )
            buyer_row = await cursor.fetchone()
            if not buyer_row:
                return PlainTextResponse("Auth: 0")

            buyer_id = buyer_row[0]

            if ip:
                await cursor.execute(
                    """
                    SELECT id
                    FROM active_sessions
                    WHERE router_id = %s
                      AND buyer_id = %s
                      AND assigned_ip = %s
                      AND status = 'active'
                      AND expiration_time > NOW()
                    LIMIT 1;
                    """,
                    (router_id, buyer_id, ip),
                )
                if await cursor.fetchone():
                    return PlainTextResponse("Auth: 1")

            # Some captive gateways report an IP that differs from the
            # assigned IP, so retain the active-session MAC fallback.
            await cursor.execute(
                """
                SELECT id
                FROM active_sessions
                WHERE router_id = %s
                  AND buyer_id = %s
                  AND status = 'active'
                  AND expiration_time > NOW()
                LIMIT 1;
                """,
                (router_id, buyer_id),
            )
            if await cursor.fetchone():
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
        params.append(f"gw_id={quote(str(gw_id), safe='')}")
    if mac:
        params.append(f"mac={quote(str(mac), safe='')}")
    if ip:
        params.append(f"ip={quote(str(ip), safe='')}")
    if url:
        params.append(f"url={quote(str(url), safe='')}")
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
        params.append(f"gw_id={quote(str(gw_id), safe='')}")
    if mac:
        params.append(f"mac={quote(str(mac), safe='')}")
    if ip:
        params.append(f"ip={quote(str(ip), safe='')}")
    if url:
        params.append(f"url={quote(str(url), safe='')}")
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
