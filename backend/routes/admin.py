from typing import Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel
from controllers.admin import AdminController

router = APIRouter()
admin_controller = AdminController()


class AdminLoginRequest(BaseModel):
    email: str
    password: str


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


class TenantUpdateRequest(BaseModel):
    tenant_id: int
    status: str


class RouterUpdateRequest(BaseModel):
    router_id: int
    status: str


class PackageUpdateRequest(BaseModel):
    package_id: int
    status: str


class VoucherUpdateRequest(BaseModel):
    voucher_id: int
    status: str


class PaymentUpdateRequest(BaseModel):
    payment_id: int
    status: str


class SessionTerminateRequest(BaseModel):
    session_id: str


@router.post("/login")
async def login_admin(payload: AdminLoginRequest):
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


@router.post("/logs")
async def create_log(payload: LogCreateRequest):
    return await admin_controller.create_log(payload.tenant_id, payload.action, payload.entity_type, payload.entity_id, payload.metadata)


@router.delete("/logs/{log_id}")
async def delete_log(log_id: int):
    return await admin_controller.delete_log(log_id)


@router.get("/tenants")
async def list_tenants():
    return await admin_controller.list_tenants()


@router.put("/tenants/status")
async def update_tenant_status(payload: TenantUpdateRequest):
    return await admin_controller.update_tenant_status(payload.tenant_id, payload.status)


@router.delete("/tenants/{tenant_id}")
async def delete_tenant(tenant_id: int):
    return await admin_controller.delete_tenant(tenant_id)


@router.get("/routers")
async def list_routers():
    return await admin_controller.list_routers()


@router.put("/routers/status")
async def update_router_status(payload: RouterUpdateRequest):
    return await admin_controller.update_router_status(payload.router_id, payload.status)


@router.delete("/routers/{router_id}")
async def delete_router(router_id: int):
    return await admin_controller.delete_router(router_id)


@router.get("/packages")
async def list_packages():
    return await admin_controller.list_packages()


@router.put("/packages/status")
async def update_package_status(payload: PackageUpdateRequest):
    return await admin_controller.update_package_status(payload.package_id, payload.status)


@router.delete("/packages/{package_id}")
async def delete_package(package_id: int):
    return await admin_controller.delete_package(package_id)


@router.get("/vouchers")
async def list_vouchers():
    return await admin_controller.list_vouchers()


@router.put("/vouchers/status")
async def update_voucher_status(payload: VoucherUpdateRequest):
    return await admin_controller.update_voucher_status(payload.voucher_id, payload.status)


@router.delete("/vouchers/{voucher_id}")
async def delete_voucher(voucher_id: int):
    return await admin_controller.delete_voucher(voucher_id)


@router.get("/payments")
async def list_payments():
    return await admin_controller.list_payments()


@router.put("/payments/status")
async def update_payment_status(payload: PaymentUpdateRequest):
    return await admin_controller.update_payment_status(payload.payment_id, payload.status)


@router.get("/sessions")
async def list_sessions():
    return await admin_controller.list_sessions()


@router.post("/sessions/terminate")
async def terminate_session(payload: SessionTerminateRequest):
    return await admin_controller.terminate_session(payload.session_id)

