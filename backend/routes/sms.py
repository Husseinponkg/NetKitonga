from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from pydantic import BaseModel

from controllers.sms import SMSController
from utils.subscription_access import require_active_subscription

router = APIRouter()
controller = SMSController()


class SendSMSRequest(BaseModel):
    phone_numbers: Optional[List[str]] = None
    text: Optional[str] = None
    messages: Optional[List[dict]] = None
    reference: str = ""


@router.post("/send", status_code=status.HTTP_200_OK, dependencies=[Depends(require_active_subscription)])
async def send_sms(data: SendSMSRequest, tenant_id: int = Query(...)):
    if data.messages:
        return await controller.send_multi(tenant_id, data.messages, data.reference)
    if data.phone_numbers and data.text:
        return await controller.send_single(tenant_id, data.phone_numbers, data.text, data.reference)
    raise HTTPException(status_code=400, detail="Provide either phone_numbers+text or messages.")
