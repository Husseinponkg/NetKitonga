from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from controllers.admin import AdminController
from models.admin import AdminLogin

router = APIRouter()
admin_controller = AdminController()


class AdminCreateRequest(BaseModel):
    name: str
    email: str
    password: str


class AdminUpdateRequest(BaseModel):
    admin_id: int
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None


class LogCreateRequest(BaseModel):
    tenant_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    metadata: Optional[dict] = None


@router.post("/login")
async def login_admin(payload: AdminLogin):
    return await admin_controller.login(payload.email, payload.password)


@router.get("/admins")
async def list_admins():
    return await admin_controller.list_admins()


@router.post("/admins")
async def create_admin(payload: AdminCreateRequest):
    return await admin_controller.create_admin(payload.name, payload.email, payload.password)


@router.put("/admins")
async def update_admin(payload: AdminUpdateRequest):
    return await admin_controller.update_admin(payload.admin_id, payload.name, payload.email, payload.password)


@router.delete("/admins/{admin_id}")
async def delete_admin(admin_id: int):
    return await admin_controller.delete_admin(admin_id)


@router.get("/stats")
async def get_admin_stats():
    return await admin_controller.get_stats()


@router.get("/logs")
async def list_logs(tenant_id: Optional[int] = Query(None), limit: int = Query(100, le=500)):
    return await admin_controller.list_logs(tenant_id, limit)


@router.get("/tenants")
async def list_tenants():
    return await admin_controller.list_tenants()


@router.get("/routers")
async def list_routers():
    return await admin_controller.list_routers()


@router.get("/packages")
async def list_packages():
    return await admin_controller.list_packages()


@router.get("/vouchers")
async def list_vouchers():
    return await admin_controller.list_vouchers()


@router.get("/payments")
async def list_payments():
    return await admin_controller.list_payments()


@router.get("/sessions")
async def list_sessions():
    return await admin_controller.list_sessions()


@router.post("/logs")
async def create_log(payload: LogCreateRequest):
    return await admin_controller.create_log(payload.tenant_id, payload.action, payload.entity_type, payload.entity_id, payload.metadata)


@router.delete("/logs/{log_id}")
async def delete_log(log_id: int):
    return await admin_controller.delete_log(log_id)
