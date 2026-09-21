from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import PlainTextResponse, RedirectResponse
from typing import Optional
from config.db import connection

wifidog_router = APIRouter()

FRONTEND_URL = "https://net-kitonga.vercel.app"

@wifidog_router.get("/ping")
async def ping():
    return PlainTextResponse("Pong")

@wifidog_router.get("/auth")
async def auth(
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
            router = await cursor.fetchone()
            if not router:
                return PlainTextResponse("Auth: 0")

            router_id = router[0]

            await cursor.execute("SELECT id FROM buyers WHERE buyer_mac = %s;", (client_mac,))
            buyer = await cursor.fetchone()
            if not buyer:
                return PlainTextResponse("Auth: 0")

            buyer_id = buyer[0]

            if ip:
                await cursor.execute(
                    """
                    SELECT id FROM active_sessions
                    WHERE router_id = %s AND buyer_id = %s AND assigned_ip = %s AND status = 'active'
                    AND expiration_time > NOW();
                    """,
                    (router_id, buyer_id, ip)
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
                (router_id, buyer_id)
            )
            session = await cursor.fetchone()
            if session:
                return PlainTextResponse("Auth: 1")

            return PlainTextResponse("Auth: 0")
    finally:
        await conn.close()

@wifidog_router.get("/login")
async def login(
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
async def portal(
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
async def msg(message: str = Query("Welcome")):
    return PlainTextResponse(f"Message: {message}")

@wifidog_router.get("/register")
async def register():
    return PlainTextResponse("OK")
