from fastapi import APIRouter, HTTPException, Query, Body

from backend.controllers.withdrawals import WithdrawalController
from backend.models.withdrawals import WithdrawalRequest, WithdrawalUpdate

router = APIRouter()

@router.get("/balance")
async def get_wallet_balance(tenant_id: int = Query(...)) -> dict:
    controller = WithdrawalController()
    return await controller.get_wallet_balance(tenant_id)

@router.post("/request")
async def request_withdrawal(data: WithdrawalRequest, tenant_id: int = Query(...)) -> dict:
    controller = WithdrawalController()
    return await controller.request_withdrawal(tenant_id, data)

@router.get("/history")
async def get_withdrawal_history(tenant_id: int = Query(...)) -> list:
    controller = WithdrawalController()
    return await controller.get_tenant_withdrawals(tenant_id)

@router.put("/update")
async def update_withdrawal_status(data: WithdrawalUpdate) -> dict:
    controller = WithdrawalController()
    return await controller.update_withdrawal_status(data)

@router.post("/callback")
async def disbursement_callback(payload: dict = Body(...)) -> dict:
    controller = WithdrawalController()
    return await controller.process_disbursement_callback(payload)
