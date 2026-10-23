from fastapi import APIRouter, status, Query, HTTPException
from typing import Dict, Any, Optional
from models.tplink import TplinkRegister, TplinkUpdate, TplinkDelete, TplinkResponse
from controllers.tplink import TplinkController

router = APIRouter()
controller = TplinkController()


@router.get("", response_model=Dict[str, Any])
async def list_tplink(tenant_id: int = Query(..., description="The tenant owning the devices")):
    return await controller.list_tplink(tenant_id)


@router.get("/", response_model=Dict[str, Any])
async def list_tplink_slash(tenant_id: int = Query(..., description="The tenant owning the devices")):
    return await controller.list_tplink(tenant_id)


@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register_tplink(data: TplinkRegister):
    return await controller.register_tplink(data)


@router.put("/update", response_model=TplinkResponse)
async def update_tplink(data: TplinkUpdate):
    return await controller.update_tplink(data)


@router.delete("/delete", response_model=TplinkResponse)
async def delete_tplink(data: TplinkDelete):
    return await controller.delete_tplink(data)


@router.get("/status", response_model=Dict[str, Any])
async def get_status(tplink_id: int = Query(..., description="The unique ID of the device")):
    return await controller.get_status(tplink_id)


@router.get("/status/", response_model=Dict[str, Any])
async def get_status_slash(tplink_id: int = Query(..., description="The unique ID of the device")):
    return await controller.get_status(tplink_id)
