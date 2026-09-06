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
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.Auth import router as auth_router
from backend.routes.branch import router as branch_router
from backend.routes.routers import router as routers_router
from backend.routes.packages import package_endpoints as packages_router
from backend.routes.customers import customer_endpoints as customers_router
from backend.routes.payment import payment_endpoints as payments_router
from backend.routes.sessions import session_endpoints
from backend.routes.settings import settings_endpoints
from backend.routes.withdrawals import router as withdrawals_router
from backend.routes.vouchers import router as vouchers_router
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://net-kitonga.vercel.app",
    ],
    allow_origin_regex=r"(?:https://(?:net-kitonga\.vercel\.app|[a-z0-9-]+\.onrender\.com)|https?://(?:localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):(?:5173|5174))$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "billing-api"}

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(branch_router, prefix="/branch", tags=["branch"]) 
app.include_router(routers_router, prefix="/routers", tags=["routers"])
app.include_router(packages_router, prefix="/packages", tags=["Packages Catalog Engine"])
app.include_router(customers_router,prefix="/customers",tags=["customers"])
app.include_router(payments_router)
app.include_router(session_endpoints)
app.include_router(settings_endpoints)
app.include_router(withdrawals_router, prefix="/withdrawals", tags=["withdrawals"])
app.include_router(vouchers_router, prefix="/vouchers", tags=["vouchers"])
if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000)

    