from fastapi import APIRouter, Query
from pydantic import BaseModel
from controllers.subscriptions import SubscriptionController

router = APIRouter()
controller = SubscriptionController()

class CheckoutRequest(BaseModel):
    tenant_id: int
    phone_number: str
    provider: str

@router.get("/status")
async def status(tenant_id: int = Query(...)):
    return await controller.get_status(tenant_id)

@router.post("/checkout")
async def checkout(data: CheckoutRequest):
    return await controller.checkout(data.tenant_id, data.phone_number, data.provider)

@router.post("/callback")
async def callback(payload: dict):
    return await controller.callback(payload)
