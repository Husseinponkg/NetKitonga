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
    auth_url = os.getenv("AZAMPAY_AUTH_URL", "https://authenticator.azampay.co.tz/AppRegistration/GenerateToken")
    app_name = os.getenv("AZAMPAY_APP_NAME", "Netkitonga")
    client_id = os.getenv("AZAMPAY_CLIENT_ID", "")
    client_secret = os.getenv("AZAMPAY_CLIENT_SECRET", "")
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

    # Get fresh AzamPay bearer token
    try:
        auth_response = requests.post(
            auth_url,
            json={"appName": app_name, "clientId": client_id, "clientSecret": client_secret},
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=15,
        )
        auth_body = auth_response.json()
        token = auth_body.get("token") or auth_body.get("accessToken")
        if not token and isinstance(auth_body.get("data"), dict):
            token = auth_body["data"].get("token") or auth_body["data"].get("accessToken")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AzamPay auth failed: {str(e)[:200]}")

    if not token:
        raise HTTPException(status_code=502, detail="AzamPay returned no access token")

    payload = {
        "accountNumber": phone,
        "amount": str(amount),
        "currency": "TZS",
        "externalId": external_id,
        "provider": data.provider,
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    }
    if api_key:
        headers["X-API-Key"] = api_key

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


@router.get("/purchase/status", status_code=status.HTTP_200_OK, dependencies=[Depends(require_active_subscription)])
async def purchase_status(gateway_reference: str = Query(...), tenant_id: int = Query(...)):
    from config.db import connection
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT tenant_id, sms_count, status FROM sms_purchases WHERE gateway_reference = %s;", (gateway_reference,))
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Purchase not found")
            t_id, sms_count, cur_status = row
            if cur_status == "completed":
                return {"success": True, "status": "completed", "message": "Credits already added"}
            # Try to verify with AzamPay
            try:
                import requests as _req
                auth_url = os.getenv("AZAMPAY_AUTH_URL", "https://authenticator.azampay.co.tz/AppRegistration/GenerateToken")
                app_name = os.getenv("AZAMPAY_APP_NAME", "Netkitonga")
                client_id = os.getenv("AZAMPAY_CLIENT_ID", "")
                client_secret = os.getenv("AZAMPAY_CLIENT_SECRET", "")
                auth_resp = _req.post(auth_url, json={"appName": app_name, "clientId": client_id, "clientSecret": client_secret}, headers={"Content-Type": "application/json", "Accept": "application/json"}, timeout=15)
                auth_body = auth_resp.json()
                token = auth_body.get("token") or auth_body.get("accessToken")
                if not token and isinstance(auth_body.get("data"), dict):
                    token = auth_body["data"].get("token") or auth_body["data"].get("accessToken")
                if token:
                    status_url = os.getenv("AZAMPAY_TRANSACTION_STATUS_URL", "https://api-disbursement.azampay.co.tz/api/v1/azampay/transactionstatus")
                    st_resp = _req.get(status_url, params={"pgReferenceId": gateway_reference, "bankName": "Azampesa"}, headers={"Authorization": f"Bearer {token}", "Accept": "application/json"}, timeout=15)
                    st_body = st_resp.json() if st_resp.headers.get("content-type", "").startswith("application/json") else {}
                    st_status = (st_body.get("status") or st_body.get("transactionStatus") or "").lower()
                    if st_status in ("success", "completed", "paid", "pending"):
                        await cursor.execute("UPDATE sms_purchases SET status = 'completed' WHERE gateway_reference = %s;", (gateway_reference,))
                        await cursor.execute(
                            "INSERT INTO sms_credits (tenant_id, balance) VALUES (%s, %s) ON CONFLICT (tenant_id) DO UPDATE SET balance = sms_credits.balance + %s, updated_at = NOW();",
                            (t_id, sms_count, sms_count),
                        )
                        await conn.commit()
                        return {"success": True, "status": "completed", "message": f"Added {sms_count} SMS credits"}
            except Exception:
                pass
            return {"success": False, "status": cur_status, "message": "Payment not yet confirmed"}
    finally:
        await conn.close()
async def send_sms(data: SendSMSRequest, tenant_id: int = Query(...)):
    if data.messages:
        return await controller.send_multi(tenant_id, data.messages, data.reference)
    if data.phone_numbers and data.text:
        return await controller.send_single(tenant_id, data.phone_numbers, data.text, data.reference)
    raise HTTPException(status_code=400, detail="Provide either phone_numbers+text or messages.")


@router.post("/purchase/confirm", status_code=status.HTTP_200_OK, dependencies=[Depends(require_active_subscription)])
async def confirm_purchase(gateway_reference: str = Query(...), tenant_id: int = Query(...)):
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT tenant_id, sms_count, status FROM sms_purchases WHERE gateway_reference = %s;", (gateway_reference,))
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Purchase not found")
            t_id, sms_count, cur_status = row
            if cur_status == "completed":
                await cursor.execute("SELECT balance FROM sms_credits WHERE tenant_id = %s;", (t_id,))
                bal_row = await cursor.fetchone()
                new_balance = int(bal_row[0]) if bal_row else sms_count
                return {"success": True, "message": "Already processed", "balance": new_balance}
            await cursor.execute("UPDATE sms_purchases SET status = 'completed' WHERE gateway_reference = %s;", (gateway_reference,))
            await cursor.execute(
                "INSERT INTO sms_credits (tenant_id, balance) VALUES (%s, %s) ON CONFLICT (tenant_id) DO UPDATE SET balance = sms_credits.balance + %s, updated_at = NOW();",
                (t_id, sms_count, sms_count),
            )
            await conn.commit()
            await cursor.execute("SELECT balance FROM sms_credits WHERE tenant_id = %s;", (t_id,))
            bal_row = await cursor.fetchone()
            new_balance = int(bal_row[0]) if bal_row else sms_count
            return {"success": True, "message": f"Added {sms_count} SMS credits", "balance": new_balance}
    finally:
        await conn.close()


@router.get("/balance", status_code=status.HTTP_200_OK)
async def sms_balance():
    return await controller.check_balance()