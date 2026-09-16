
from fastapi import APIRouter, Query, Depends, status, HTTPException, Body
from typing import List, Dict, Any
import requests
from models.payments import CheckoutRequest, PaymentHistoryResponse, PortalBuyerRequest
from services.payments import PaymentService
from controllers.payments import PaymentController

payment_endpoints = APIRouter(prefix="/api/payments", tags=["AzamPay Micro-Billing Engine"])
service = PaymentService()
controller = PaymentController()

@payment_endpoints.get("/azampay/diagnostic")
async def handle_azampay_diagnostic():
    auth_ok = False
    checkout_ok = False
    auth_error = None
    checkout_error = None
    try:
        token = service._get_bearer_token()
        auth_ok = bool(token)
    except Exception as err:
        auth_error = str(err)

    try:
        response = requests.post(
            service.checkout_url,
            json={
                "accountNumber": "0712345678",
                "additionalProperties": {},
                "amount": 100.0,
                "currency": "TZS",
                "externalId": "DIAGNOSTIC-123",
                "provider": "Mpesa",
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token if auth_ok else 'missing'}",
            },
            timeout=service.checkout_timeout,
        )
        checkout_ok = response.status_code in (200, 201, 202)
        checkout_error = response.text if not checkout_ok else None
    except Exception as err:
        checkout_error = str(err)

    return {
        "auth_url": service.auth_url,
        "checkout_url": service.checkout_url,
        "auth_ok": auth_ok,
        "auth_error": auth_error,
        "checkout_ok": checkout_ok,
        "checkout_error": checkout_error,
    }

@payment_endpoints.post("/checkout", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def handle_checkout_trigger(payload: CheckoutRequest):
    """Fired automatically from the captive portal buy buttons to execute USSD prompts."""
    return await service.initiate_mno_checkout(payload)

@payment_endpoints.post("/portal/buyer", response_model=Dict[str, int], status_code=status.HTTP_200_OK)
async def handle_portal_buyer(payload: PortalBuyerRequest):
    return {"buyer_id": await service.register_portal_buyer(payload)}

@payment_endpoints.get("/history", response_model=List[PaymentHistoryResponse])
async def handle_get_payment_ledger(tenant_id: int = Query(..., description="The active business tenant ID context")):
    """Fetches the comprehensive financial history ledger array joined securely with buyer details."""
    return await service.get_tenant_payment_history(tenant_id)

@payment_endpoints.get("/income/stats")
async def handle_get_income_stats(tenant_id: int = Query(...)):
    """Aggregated income summary: totals by status, counts, and overall revenue."""
    return await service.get_tenant_income_stats(tenant_id)

@payment_endpoints.post("/webhook/callback")
async def handle_azampay_gateway_callback(payload: dict = Body(...)):
    """
    Public asynchronous webhook destination url. 
    Point your AzamPay developer profile web portal configurations to this route path.
    """
    external_id = payload.get("externalId")
    transaction_status = payload.get("transactionStatus", "").lower()
    
    if not external_id:
        raise HTTPException(status_code=400, detail="Missing required gateway unique tracing properties.")
        
    is_success = (transaction_status == "success")
    acknowledged = await controller.process_asynchronous_callback(external_id, is_success)
    
    if not acknowledged:
        raise HTTPException(status_code=400, detail="Callback payload failed system parsing or was dropped.")
        
    return {"status": "acknowledged", "code": 200}