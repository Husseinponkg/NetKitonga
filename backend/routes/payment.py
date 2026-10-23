from typing import Any, Dict, List

from fastapi import APIRouter, Body, HTTPException, Query, status

from controllers.payments import PaymentController
from models.payments import CheckoutRequest, PaymentHistoryResponse, PortalBuyerRequest
from services.payments import PaymentService

payment_endpoints = APIRouter(
    tags=["AzamPay Micro-Billing Engine"],
)

service = PaymentService()
controller = PaymentController()


@payment_endpoints.get("/payments/azampay/diagnostic")
async def handle_azampay_diagnostic() -> Dict[str, Any]:
    """Check AzamPay authentication/configuration without initiating a payment.

    Do not turn this into a checkout test: a checkout request may send a real
    mobile-money prompt and must use a unique external reference.
    """
    auth_ok = False
    auth_error = None

    try:
        token = service._get_bearer_token()
        auth_ok = bool(token)
    except Exception as err:
        # Keep diagnostic errors concise and never return credentials or tokens.
        auth_error = str(getattr(err, "detail", "AzamPay authentication check failed."))[:300]

    return {
        "auth_url": service.auth_url,
        "checkout_url": service.checkout_url,
        "auth_ok": auth_ok,
        "auth_error": auth_error,
        "checkout_configured": bool(service.checkout_url and service.api_key),
        "checkout_test_performed": False,
        "message": (
            "Authentication succeeded. Checkout has not been tested to avoid creating a payment."
            if auth_ok
            else "Authentication failed. Check the server logs and AzamPay sandbox configuration."
        ),
    }


@payment_endpoints.post(
    "/payments/checkout",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def handle_checkout_trigger(payload: CheckoutRequest) -> Dict[str, Any]:
    """Start a mobile-money checkout from the captive portal."""
    return await service.initiate_mno_checkout(payload)


@payment_endpoints.post(
    "/payments/portal/buyer",
    response_model=Dict[str, int],
    status_code=status.HTTP_200_OK,
)
async def handle_portal_buyer(payload: PortalBuyerRequest) -> Dict[str, int]:
    return {"buyer_id": await service.register_portal_buyer(payload)}


@payment_endpoints.get("/payments/status")
async def handle_portal_payment_status(
    gateway_reference: str = Query(...),
    router_id: int = Query(...),
    buyer_mac: str = Query(...),
) -> Dict[str, Any]:
    return await controller.get_portal_payment_status(
        gateway_reference,
        router_id,
        buyer_mac,
    )


@payment_endpoints.get(
    "/payments/history",
    response_model=List[PaymentHistoryResponse],
)
async def handle_get_payment_ledger(
    tenant_id: int = Query(..., description="The active business tenant ID context"),
) -> List[PaymentHistoryResponse]:
    """Return the tenant's payment history."""
    return await service.get_tenant_payment_history(tenant_id)


@payment_endpoints.get("/payments/income/stats")
async def handle_get_income_stats(tenant_id: int = Query(...)) -> Dict[str, Any]:
    """Return aggregated income statistics for a tenant."""
    return await service.get_tenant_income_stats(tenant_id)


@payment_endpoints.post("/payments/webhook/callback")
async def handle_azampay_gateway_callback(
    payload: Dict[str, Any] = Body(...),
) -> Dict[str, Any]:
    """Process AzamPay's asynchronous payment callback.

    Confirm the exact field names/status values against the callback sample in
    your AzamPay sandbox portal. Unknown statuses are rejected rather than
    incorrectly marking a payment as failed.
    """
    # Some gateways wrap callback properties inside `data`; accept either shape.
    callback_data: Dict[str, Any] = payload
    if isinstance(payload.get("data"), dict):
        callback_data = payload["data"]

    external_id = (
        callback_data.get("utilityref")
        or callback_data.get("externalId")
        or callback_data.get("external_id")
    )
    external_reference = (
        callback_data.get("externalreference")
        or callback_data.get("external_reference")
        or callback_data.get("reference")
    )
    raw_status = (
        callback_data.get("transactionstatus")
        or callback_data.get("transactionStatus")
        or callback_data.get("status")
        or callback_data.get("transaction_status")
    )
    callback_amount = (
        callback_data.get("amount")
        or callback_data.get("transactionAmount")
        or callback_data.get("transaction_amount")
        or callback_data.get("payAmount")
    )
    callback_operator = (
        callback_data.get("operator")
        or callback_data.get("paymentOperator")
        or callback_data.get("payment_operator")
    )
    callback_signature = (
        callback_data.get("signature")
        or callback_data.get("sign")
    )
    pg_transaction_id = (
        callback_data.get("transid")
        or callback_data.get("pgTransactionId")
        or callback_data.get("pg_transaction_id")
    )

    if not external_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing external transaction reference in AzamPay callback.",
        )

    if not isinstance(raw_status, str) or not raw_status.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing transaction status in AzamPay callback.",
        )

    transaction_status = raw_status.strip().lower()
    success_statuses = {"success", "successful", "completed", "paid"}
    failure_statuses = {
        "failed", "failure", "unsuccessful", "cancelled", "canceled", "rejected"
    }

    if transaction_status in success_statuses:
        is_successful = True
    elif transaction_status in failure_statuses:
        is_successful = False
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unrecognized AzamPay transaction status.",
        )

    acknowledged = await controller.process_asynchronous_callback(
        str(external_id),
        is_successful,
        callback_amount,
        callback_operator,
        callback_signature,
        str(external_reference) if external_reference else None,
        str(pg_transaction_id) if pg_transaction_id else None,
    )
    if not acknowledged:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Callback transaction reference was not found or could not be processed.",
        )

    return {"status": "acknowledged", "code": 200}
