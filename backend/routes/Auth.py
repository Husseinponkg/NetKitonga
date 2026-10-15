from fastapi import APIRouter, HTTPException

from backend.controllers.auth import AuthController
from backend.models.tenants import TenantRegister, TenantLogin, TenantUpdate, TenantDelete

router = APIRouter()

@router.post("/register")
async def register(tenant: TenantRegister) -> dict:
    auth_controller = AuthController()
    result = await auth_controller.register(tenant.business_name, tenant.system_name, tenant.email, tenant.password)
    if "already exists" in result.get("message", ""):
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.post("/login")
async def login(user: TenantLogin) -> dict:
    auth_controller = AuthController()
    result = await auth_controller.login(user.email, user.password)
    if "user" in result:
        return result
    raise HTTPException(status_code=400, detail=result["message"])

@router.put("/update")
async def update(tenant: TenantUpdate) -> dict:
    auth_controller = AuthController()
    result = await auth_controller.update(tenant.email, tenant.business_name, tenant.system_name, tenant.email, tenant.password)
    return result

@router.delete("/delete")
async def delete(tenant: TenantDelete) -> dict:
    auth_controller = AuthController()
    result = await auth_controller.delete(tenant.id)
    return result
