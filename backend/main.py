from pathlib import Path
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.routes.admin import router as admin_router
from backend.routes.Auth import router as auth_router
from backend.routes.branch import router as branch_router
from backend.routes.routers import router as routers_router, wifidog_router
from backend.routes.packages import package_endpoints as packages_router
from backend.routes.customers import customer_endpoints as customers_router
from backend.routes.payment import payment_endpoints as payments_router
from backend.routes.sessions import session_endpoints
from backend.routes.settings import settings_endpoints
from backend.routes.withdrawals import router as withdrawals_router
from backend.routes.vouchers import router as vouchers_router
from backend.routes.radius import radius_endpoints

app = FastAPI()

# CORS Configuration - Fixed to allow hotspot clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://netkitonga.com",
        "http://netkitonga.com",
        "http://netkitonga.com:8000",
        "http://195.211.99.95:8000",
        "http://127.0.0.1:8000",
    ],
    # Allow any local IP (10.x.x.x, 192.168.x.x, 172.16-31.x.x) on any port
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(?::\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_BUILD_DIR = ROOT_DIR / "frontend" / "dist"


def serve_frontend(path: str):
    full_path = FRONTEND_BUILD_DIR / path.lstrip("/")
    if full_path.exists() and full_path.is_file():
        return FileResponse(full_path)
    return FileResponse(FRONTEND_BUILD_DIR / "index.html")


@app.middleware("http")
async def spa_navigation_middleware(request: Request, call_next):
    if request.method == "GET":
        path = request.url.path
        accept = request.headers.get("accept", "")
        if "text/html" in accept:
            # Skip static files (have extensions like .png, .svg, .ico, .js, .css, etc.)
            if "." in path.split("/")[-1]:
                return await call_next(request)
            # For HTML requests, always serve SPA (index.html) for non-static paths
            # This allows frontend routes like /routers, /branch, /vouchers to work
            return FileResponse(FRONTEND_BUILD_DIR / "index.html")
    return await call_next(request)


@app.get("/")
async def health_check():
    return {"status": "ok", "service": "billing-api"}


app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(branch_router, prefix="/branch", tags=["branch"])
app.include_router(routers_router, prefix="/routers", tags=["routers"])
app.include_router(wifidog_router, prefix="/wifidog", tags=["wifidog"])
app.include_router(packages_router, prefix="/packages", tags=["Packages Catalog Engine"])
app.include_router(customers_router, prefix="/customers", tags=["customers"])
app.include_router(payments_router)
app.include_router(session_endpoints)
app.include_router(settings_endpoints)
app.include_router(withdrawals_router, prefix="/withdrawals", tags=["withdrawals"])
app.include_router(vouchers_router, prefix="/vouchers", tags=["vouchers"])
from backend.routes.captive import captive_router as captive_endpoints

app.include_router(captive_endpoints, prefix="/captive", tags=["captive"])

app.include_router(radius_endpoints, prefix="/radius", tags=["radius"])


@app.get("/assets/{path:path}")
async def serve_frontend_assets(path: str):
    full_path = FRONTEND_BUILD_DIR / "assets" / path.lstrip("/")
    if full_path.exists() and full_path.is_file():
        return FileResponse(full_path)
    return FileResponse(FRONTEND_BUILD_DIR / "index.html")


@app.get("/{full_path:path}")
async def serve_frontend_catchall(full_path: str):
    return serve_frontend(full_path)


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000)
