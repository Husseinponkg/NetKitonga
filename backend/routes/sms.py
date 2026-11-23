from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException, Request
from pydantic import BaseModel
import os, requests, secrets

from controllers.sms import SMSController
from utils.subscription_access import require_active_subscription
from config.db import connection

router = APIRouter()
controller = SMSController()


class SendSMSRequest(BaseModel):
    phone_numbers: Optional[List[str]] = None
    text: Optional[str] = None
    messages: Optional[List[dict]] = None
    reference: str = ""


class BuyCreditsRequest(BaseModel):
    count: int
    phone_number: str
    provider: str = "Mpesa"


@router.get("/credits", status_code=status.HTTP_200_OK, dependencies=[Depends(require_active_subscription)])
async def sms_credits(tenant_id: int = Query(...)):
    return await controller.get_credits(tenant_id)


@router.post("/buy", status_code=status.HTTP_200_OK, dependencies=[Depends(require_active_subscription)])
async def buy_credits(data: BuyCreditsRequest, tenant_id: int = Query(...)):
    checkout_url = os.getenv("AZAMPAY_MNO", "https://checkout.azampay.co.tz/azampay/mno/checkout")
    api_key = os.getenv("AZAMPAY_TOKEN", "")
    amount = data.count * 20
    external_id = f"SMS-{secrets.token_hex(8).upper()}"
    phone = data.phone_number.strip().replace("+", "").replace(" ", "")
    if phone.startswith("0"):
        phone = "255" + phone[1:]

    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "INSERT INTO sms_purchases (tenant_id, phone_number, amount, sms_count, gateway_reference, status) VALUES (%s, %s, %s, %s, %s, 'pending');",
                (tenant_id, phone, amount, data.count, external_id),
            )
            await conn.commit()
    finally:
        await conn.close()

    payload = {
        "accountNumber": phone,
        "amount": str(amount),
        "currency": "TZS",
        "externalId": external_id,
        "provider": data.provider,
    }
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        response = requests.post(checkout_url, json=payload, headers=headers, timeout=30)
        body = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": response.text}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AzamPay checkout failed: {str(e)[:200]}")

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"AzamPay rejected: {body.get('message', response.text)[:300]}")

    return {"success": True, "gateway_reference": external_id, "result": body}


@router.post("/buy/callback", status_code=status.HTTP_200_OK)
async def buy_callback(request: Request):
    data = await request.json()
    external_id = data.get("externalId") or data.get("external_id")
    status_val = (data.get("transactionStatus") or data.get("status") or "").lower()
    if not external_id:
        raise HTTPException(status_code=400, detail="Missing externalId")
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT tenant_id, sms_count, status FROM sms_purchases WHERE gateway_reference = %s;", (external_id,))
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Purchase not found")
            tenant_id, sms_count, cur_status = row
            if cur_status == "completed":
                return {"success": True, "message": "Already processed"}
            if status_val in ("success", "completed", "paid"):
                await cursor.execute("UPDATE sms_purchases SET status = 'completed' WHERE gateway_reference = %s;", (external_id,))
                await cursor.execute(
                    "INSERT INTO sms_credits (tenant_id, balance) VALUES (%s, %s) ON CONFLICT (tenant_id) DO UPDATE SET balance = sms_credits.balance + %s, updated_at = NOW();",
                    (tenant_id, sms_count, sms_count),
                )
                await conn.commit()
                return {"success": True, "message": f"Added {sms_count} SMS credits"}
            else:
                await cursor.execute("UPDATE sms_purchases SET status = 'failed' WHERE gateway_reference = %s;", (external_id,))
                await conn.commit()
                return {"success": False, "message": "Payment not completed"}
    finally:
        await conn.close()


@router.post("/send", status_code=status.HTTP_200_OK, dependencies=[Depends(require_active_subscription)])
async def send_sms(data: SendSMSRequest, tenant_id: int = Query(...)):
    if data.messages:
        return await controller.send_multi(tenant_id, data.messages, data.reference)
    if data.phone_numbers and data.text:
        return await controller.send_single(tenant_id, data.phone_numbers, data.text, data.reference)
    raise HTTPException(status_code=400, detail="Provide either phone_numbers+text or messages.")


@router.get("/balance", status_code=status.HTTP_200_OK, dependencies=[Depends(require_active_subscription)])
async def sms_balance():
    return await controller.check_balance()
