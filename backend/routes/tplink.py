from fastapi import APIRouter, status, Query, HTTPException, Depends
from typing import Dict, Any, Optional
from models.tplink import (
    TplinkAuthorizeRequest,
    TplinkRegister,
    TplinkUpdate,
    TplinkDelete,
    TplinkResponse,
)
from controllers.tplink import TplinkController
from utils.subscription_access import require_active_subscription

router = APIRouter()
controller = TplinkController()


@router.get("", response_model=Dict[str, Any], dependencies=[Depends(require_active_subscription)])
async def list_tplink(tenant_id: int = Query(..., description="The tenant owning the devices")):
    return await controller.list_tplink(tenant_id)


@router.get("/", response_model=Dict[str, Any], dependencies=[Depends(require_active_subscription)])
async def list_tplink_slash(tenant_id: int = Query(..., description="The tenant owning the devices")):
    return await controller.list_tplink(tenant_id)

@router.get("/resolve", response_model=Dict[str, Any])
async def resolve_tplink(
    ip_address: Optional[str] = Query(None, description="TP-Link EAP target IP from the Omada portal redirect"),
    ap_mac: Optional[str] = Query(None, description="TP-Link AP MAC from the Omada portal redirect"),
):
    if not ip_address and not ap_mac:
        raise HTTPException(
            status_code=400,
            detail="ip_address or ap_mac is required.",
        )
    return await controller.resolve_portal_device(ip_address, ap_mac)


@router.post("/authorize")
async def authorize_tplink_client(data: TplinkAuthorizeRequest):
    return await controller.authorize_portal_client(data)


@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_active_subscription)])
async def register_tplink(data: TplinkRegister):
    return await controller.register_tplink(data)


@router.put("/update", response_model=TplinkResponse, dependencies=[Depends(require_active_subscription)])
async def update_tplink(data: TplinkUpdate):
    return await controller.update_tplink(data)


@router.delete("/delete", response_model=TplinkResponse, dependencies=[Depends(require_active_subscription)])
async def delete_tplink(data: TplinkDelete):
    return await controller.delete_tplink(data)



@router.get("/ping")
async def tplink_ping(nas_id: Optional[str] = Query(None), tplink_id: Optional[int] = Query(None)):
    identifier = nas_id if nas_id else (str(tplink_id) if tplink_id else None)
    if not identifier:
        raise HTTPException(status_code=400, detail="nas_id or tplink_id is required.")
    return await controller.process_heartbeat(identifier)

@router.get("/ping/")
async def tplink_ping_slash(nas_id: Optional[str] = Query(None), tplink_id: Optional[int] = Query(None)):
    identifier = nas_id if nas_id else (str(tplink_id) if tplink_id else None)
    if not identifier:
        raise HTTPException(status_code=400, detail="nas_id or tplink_id is required.")
    return await controller.process_heartbeat(identifier)

@router.get("/status", response_model=Dict[str, Any], dependencies=[Depends(require_active_subscription)])
async def get_status(tplink_id: int = Query(..., description="The unique ID of the device")):
    return await controller.get_status(tplink_id)


@router.get("/status/", response_model=Dict[str, Any], dependencies=[Depends(require_active_subscription)])
async def get_status_slash(tplink_id: int = Query(..., description="The unique ID of the device")):
    return await controller.get_status(tplink_id)
