from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from config.db import connection
from utils.mac import normalize_mac

captive_router = APIRouter()


@captive_router.get("/redirect")
async def redirect_to_internet(
    router_id: int = Query(..., description="Router used for the purchase or voucher redemption"),
    tenant_id: int = Query(..., description="Tenant context"),
    buyer_mac: str = Query(..., description="Buyer device MAC address"),
    session_id: str = Query(None, description="Optional active session identifier"),
    auth_token: str = Query(None, description="Optional authentication token for login submission"),
):
    """
    After a successful payment or voucher redemption, redirect the buyer
    to the correct captive-portal login flow for the router they are on.
    """
    normalized_mac = normalize_mac(buyer_mac)
    if not normalized_mac:
        raise HTTPException(status_code=400, detail="Invalid buyer MAC address.")

    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """
                SELECT r.ip_address, r.driver_type, r.gw_id, r.nas_identifier,
                       s.session_id, s.assigned_ip
                FROM routers r
                LEFT JOIN active_sessions s
                    ON s.router_id = r.id
                    AND s.router_id = %s
                    AND s.buyer_id = (
                        SELECT id FROM buyers
                        WHERE tenant_id = r.tenant_id
                          AND buyer_mac = %s
                        LIMIT 1
                    )
                    AND s.status = 'active'
                    AND s.expiration_time > NOW()
                WHERE r.id = %s
                  AND r.tenant_id = %s
                LIMIT 1;
                """,
                (router_id, normalized_mac, router_id, tenant_id),
            )
            router_row = await cursor.fetchone()
            if not router_row:
                raise HTTPException(status_code=404, detail="Router profile was not found for this redirect.")

            ip_address, driver_type, gw_id, nas_identifier, session_id, assigned_ip = router_row
    finally:
        await conn.close()

    ip_address = str(ip_address or "").strip()
    driver_type = str(driver_type or "").strip().lower()
    normalized_mac = normalize_mac(buyer_mac)

    if not ip_address:
        raise HTTPException(status_code=500, detail="Router IP address is missing.")

    if driver_type == "mikrotik_radius":
        login_url = f"http://{ip_address}/login"
        return RedirectResponse(url=login_url, status_code=302)

    if driver_type == "wifidog_http":
        params = []
        if gw_id:
            params.append(f"gw_id={gw_id}")
        if normalized_mac:
            params.append(f"mac={normalized_mac}")
        if assigned_ip:
            params.append(f"ip={assigned_ip}")
        if session_id:
            params.append(f"session_id={session_id}")
        if auth_token:
            params.append(f"auth_token={auth_token}")
        query = ("?" + "&".join(params)) if params else ""
        return RedirectResponse(url=f"http://{ip_address}/wifidog/login{query}", status_code=302)

    raise HTTPException(status_code=400, detail=f"Unsupported router driver type: {driver_type}")
