from typing import List, Dict, Any

from fastapi import APIRouter, Query, status, HTTPException

from controllers.vouchers import VoucherController
from models.vouchers import VoucherCreate, VoucherResponse, VoucherRedeem


router = APIRouter()
controller = VoucherController()


@router.post("/create", response_model=List[VoucherResponse], status_code=status.HTTP_201_CREATED)
async def create_vouchers(data: VoucherCreate, tenant_id: int = Query(...)):
    return await controller.create(tenant_id, data)


@router.get("", response_model=List[VoucherResponse])
async def get_vouchers(tenant_id: int = Query(...)):
    return await controller.list(tenant_id)


@router.post("/redeem", response_model=Dict[str, Any])
async def redeem_voucher(data: VoucherRedeem, tenant_id: int = Query(...)):
    return await controller.redeem(tenant_id, data)