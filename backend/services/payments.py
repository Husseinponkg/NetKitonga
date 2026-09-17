import os
import secrets
import sys
from pathlib import Path
from typing import List, Dict, Any

import requests
from fastapi import HTTPException
from dotenv import load_dotenv

backend_dir = str(Path(__file__).resolve().parents[1])

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from config.db import connection
from models.payments import CheckoutRequest, PortalBuyerRequest
from controllers.payments import PaymentController


# Load .env from project root or backend folder
env_paths = [
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent / ".env",
]
loaded = False
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        loaded = True
        break
if not loaded:
    load_dotenv()


class PaymentService:

    def __init__(self):

        self.payment_controller = PaymentController()

        # ============================================================
        # AZAMPAY URLs
        # ============================================================

        checkout_base_url = os.getenv(
            "AZAMPAY_CHECKOUT_BASE_URL",
            os.getenv(
                "AZAMPAY_SANDBOX_CHECKOUT_BASE_URL",
                os.getenv(
                    "Azampay_Sandbox_Checkout_Base_Url",
                    "https://sandbox.azampay.co.tz",
                ),
            ),
        ).rstrip("/")

        configured_auth_url = os.getenv(
            "AZAMPAY_AUTH_URL",
            os.getenv(
                "AZAMPAY_SANDBOX_AUTH_URL",
                None,
            ),
        )

        auth_base_url = os.getenv(
            "AZAMPAY_AUTH_BASE_URL",
            os.getenv(
                "AZAMPAY_SANDBOX_AUTH_BASE_URL",
                os.getenv(
                    "AZAMPAY_AUTH_HOST",
                    "https://authenticator-sandbox.azampay.co.tz",
                ),
            ),
        ).rstrip("/")

        if configured_auth_url:
            self.auth_url = configured_auth_url.rstrip("/")
        else:
            self.auth_url = f"{auth_base_url}/AppRegistration/GenerateToken"

        self.checkout_url = os.getenv(
            "AZAMPAY_MNO",
            os.getenv(
                "AZAMPAY_CHECKOUT_URL",
                f"{checkout_base_url}/azampay/mno/checkout",
            ),
        )

        # ============================================================
        # TIMEOUT
        # ============================================================

        # 60 seconds gives the sandbox enough time to respond.
        self.auth_timeout = int(
            os.getenv("AZAMPAY_AUTH_TIMEOUT", "15")
        )

        self.checkout_timeout = int(
            os.getenv("AZAMPAY_CHECKOUT_TIMEOUT", "90")
        )

        # IMPORTANT:
        # Do not automatically retry MNO checkout.
        # A retry could potentially create another payment request.
        self.checkout_retries = 1

        # ============================================================
        # AZAMPAY CREDENTIALS
        # ============================================================

        self.app_name = os.getenv("AZAMPAY_APP_NAME")
        self.client_id = os.getenv("AZAMPAY_CLIENT_ID")
        self.client_secret = os.getenv("AZAMPAY_CLIENT_SECRET")

        # AzamPay's flow is two-step: get a Bearer token from the
        # credentials above, THEN call the actual endpoint with both
        # the Bearer token AND this X-API-Key header. Without it,
        # AzamPay rejects (or silently hangs on) the checkout call.
        # Get this from the sandbox portal's app settings page —
        # it is separate from clientId / clientSecret.
        # Falls back to AZAMPAY_TOKEN for .env files that used that
        # older name for the same value.
        self.api_key = os.getenv(
            "AZAMPAY_API_KEY",
            os.getenv("AZAMPAY_TOKEN"),
        )

        # Provider values AzamPay accepts for MNO checkout.
        # Anything outside this set gets normalized/rejected before
        # we waste a network round trip.
        self.valid_providers = {
            "airtel": "Airtel",
            "tigo": "Tigo",
            "tigopesa": "Tigo",
            "halopesa": "Halopesa",
            "azampesa": "Azampesa",
            "mpesa": "Mpesa",
        }

    # ================================================================
    # CONFIGURATION VALIDATION
    # ================================================================

    def _validate_configuration(self) -> None:

        missing = []

        if not self.app_name:
            missing.append("AZAMPAY_APP_NAME")

        if not self.client_id:
            missing.append("AZAMPAY_CLIENT_ID")

        if not self.client_secret:
            missing.append("AZAMPAY_CLIENT_SECRET")

        if not self.api_key:
            missing.append("AZAMPAY_API_KEY")

        if missing:
            raise HTTPException(
                status_code=500,
                detail=(
                    "AzamPay credentials are not configured. "
                    f"Missing: {', '.join(missing)}"
                ),
            )

    # ================================================================
    # NORMALIZE PHONE NUMBER
    # ================================================================

    def _normalize_phone(self, phone: Any) -> str:

        if phone is None:
            raise HTTPException(
                status_code=400,
                detail="Phone number is required."
            )

        phone = str(phone).strip()

        # Remove spaces
        phone = phone.replace(" ", "")

        # Convert +255XXXXXXXXX -> 255XXXXXXXXX
        if phone.startswith("+255"):
            phone = phone[1:]

        # Convert 07XXXXXXXX -> 2557XXXXXXXX
        elif phone.startswith("0"):
            phone = "255" + phone[1:]

        # Basic validation
        if not phone.startswith("255"):
            raise HTTPException(
                status_code=400,
                detail="Invalid Tanzania phone number. Use 07XXXXXXXX or 2557XXXXXXXX."
            )

        if len(phone) != 12:
            raise HTTPException(
                status_code=400,
                detail="Invalid Tanzania phone number length."
            )

        return phone

    # ================================================================
    # NORMALIZE PROVIDER
    # ================================================================

    def _normalize_provider(self, provider: Any) -> str:

        if not provider:
            raise HTTPException(
                status_code=400,
                detail="Mobile network provider is required.",
            )

        key = str(provider).strip().lower()

        normalized = self.valid_providers.get(key)

        if not normalized:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported provider. Must be one of: "
                    "Airtel, Tigo, Halopesa, Azampesa, Mpesa."
                ),
            )

        return normalized

    # ================================================================
    # GET AZAMPAY TOKEN
    # ================================================================

    def _get_bearer_token(self) -> str:

        self._validate_configuration()

        payload = {
            "appName": self.app_name,
            "clientId": self.client_id,
            "clientSecret": self.client_secret,
        }

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        auth_error = None

        try:

            response = requests.post(
                self.auth_url,
                json=payload,
                headers=headers,
                timeout=self.auth_timeout,
            )

            print("========================================")
            print("AZAMPAY TOKEN DEBUG")
            print("URL:", self.auth_url)
            print("STATUS:", response.status_code)
            print("RESPONSE:", response.text)
            print("========================================")

            if response.status_code == 200:

                try:
                    body = response.json()
                except ValueError:
                    auth_error = "AzamPay token server returned invalid JSON."
                else:
                    token = None

                    if isinstance(body, dict):
                        token = (
                            body.get("token")
                            or body.get("accessToken")
                        )

                        data = body.get("data")

                        if isinstance(data, dict):
                            token = (
                                token
                                or data.get("token")
                                or data.get("accessToken")
                            )

                    if token:
                        return str(token)

                    auth_error = "AzamPay returned HTTP 200 but no access token."
            else:
                auth_error = (
                    "AzamPay token generation failed. "
                    f"HTTP {response.status_code}. "
                    f"Response: {response.text[:500]}"
                )

        except requests.exceptions.Timeout as err:
            auth_error = f"Connection to AzamPay authentication server timed out: {str(err)}"

        except requests.exceptions.RequestException as err:
            auth_error = f"Failed to connect to AzamPay authentication server: {str(err)}"

        detail = auth_error or "AzamPay token generation failed."

        raise HTTPException(
            status_code=502,
            detail=detail,
        )

    # ================================================================
    # MNO CHECKOUT
    # ================================================================
    async def initiate_mno_checkout(
        self,
        data: CheckoutRequest
    ) -> Dict[str, Any]:

        # ====================================================
        # 1. GET PACKAGE PRICE VIA CONTROLLER
        # ====================================================

        price_info = await self.payment_controller.get_package_price(data.package_id)

        if not price_info:
            raise HTTPException(
                status_code=404,
                detail="Package not found.",
            )

        amount = price_info["price"]

        # ====================================================
        # 2. NORMALIZE PHONE + PROVIDER
        # ====================================================

        phone = self._normalize_phone(
            data.phone_number
        )

        provider = self._normalize_provider(data.provider)

        # ====================================================
        # 3. GENERATE UNIQUE REFERENCE
        # ====================================================

        external_id = (
            f"NETKITONGA-"
            f"{secrets.token_hex(8).upper()}"
        )

        auth_token = secrets.token_urlsafe(32)

        # ====================================================
        # 4. CREATE PENDING PAYMENT VIA CONTROLLER
        # ====================================================

        payment_create_data = {
            "tenant_id": data.tenant_id,
            "branch_id": data.branch_id,
            "router_id": data.router_id,
            "package_id": data.package_id,
            "buyer_id": data.buyer_id,
            "amount": amount,
            "gateway_reference": external_id,
            "auth_token": auth_token,
        }

        new_payment_id = await self.payment_controller.create_pending_payment(
            payment_create_data
        )

        # ====================================================
        # 5. GET FRESH AZAMPAY TOKEN
        # ====================================================

        token = self._get_bearer_token()

        # ====================================================
        # 6. BUILD AZAMPAY PAYLOAD
        # ====================================================

        checkout_payload = {
            "accountNumber": phone,
            "additionalProperties": {},
            "amount": float(amount),
            "currency": "TZS",
            "externalId": external_id,
            "provider": provider,
        }

        checkout_headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
        }

        if self.api_key:
            checkout_headers["X-API-Key"] = self.api_key

        # ====================================================
        # SAFE LOGGING
        # ====================================================

        print("========================================")
        print("AZAMPAY CHECKOUT DEBUG")
        print("URL:", self.checkout_url)
        print("METHOD: POST")
        print("PHONE:", phone)
        print("AMOUNT:", float(amount))
        print("CURRENCY: TZS")
        print("PROVIDER:", provider)
        print("EXTERNAL ID:", external_id)
        print("TOKEN: [HIDDEN]")
        print("X-API-KEY: [HIDDEN]")
        print("========================================")

        # ====================================================
        # 7. SEND CHECKOUT REQUEST
        # ====================================================

        try:

            response = requests.post(
                self.checkout_url,
                json=checkout_payload,
                headers=checkout_headers,
                timeout=self.checkout_timeout,
            )

        except requests.exceptions.Timeout as err:

            print("========================================")
            print("AZAMPAY CHECKOUT TIMEOUT")
            print("TIMEOUT:", self.checkout_timeout)
            print("ERROR:", str(err))
            print("========================================")

            await self.payment_controller.mark_payment_failed(new_payment_id)

            raise HTTPException(
                status_code=504,
                detail=(
                    "AzamPay checkout timed out after "
                    f"{self.checkout_timeout} seconds."
                ),
            )

        except requests.exceptions.RequestException as err:

            print("========================================")
            print("AZAMPAY CHECKOUT NETWORK ERROR")
            print("ERROR:", str(err))
            print("========================================")

            await self.payment_controller.mark_payment_failed(new_payment_id)

            raise HTTPException(
                status_code=502,
                detail=(
                    "Could not connect to AzamPay checkout: "
                    f"{str(err)}"
                ),
            )

        # ====================================================
        # 8. LOG AZAMPAY RESPONSE
        # ====================================================

        print("========================================")
        print("AZAMPAY CHECKOUT RESPONSE")
        print("STATUS:", response.status_code)
        print("RESPONSE:", response.text)
        print("========================================")

        # ====================================================
        # 9. SUCCESS
        # ====================================================

        if response.status_code in (
            200,
            201,
            202
        ):

            return {
                "status": "pending",
                "payment_id": new_payment_id,
                "gateway_reference": external_id,
                "auth_token": auth_token,
                "message": (
                    "AzamPay transaction initiated. "
                    "Please check your mobile phone "
                    "and enter your mobile money PIN."
                ),
            }

        # ====================================================
        # 10. AZAMPAY REJECTED REQUEST
        # ====================================================

        await self.payment_controller.mark_payment_failed(new_payment_id)

        raise HTTPException(
            status_code=400,
            detail=(
                "AzamPay checkout rejected the request. "
                f"HTTP {response.status_code}. "
                f"Response: {response.text[:1000]}"
            ),
        )

    # ================================================================
    # REGISTER PORTAL BUYER
    # ================================================================

    async def register_portal_buyer(
        self,
        data: PortalBuyerRequest
    ) -> int:

        buyer_data = {
            "tenant_id": data.tenant_id,
            "buyer_mac": data.buyer_mac,
            "phone_number": data.phone_number,
        }

        return await self.payment_controller.register_portal_buyer(
            buyer_data
        )

    # ================================================================
    # PAYMENT HISTORY
    # ================================================================

    async def get_tenant_payment_history(
        self,
        tenant_id: int
    ) -> List[Dict[str, Any]]:

        rows = await self.payment_controller.get_payment_history(tenant_id)

        ledger_collection = []

        for row in rows:
            ledger_collection.append(
                {
                    "id": row.get("id"),
                    "tenant_id": row.get("tenant_id"),
                    "branch_id": row.get("branch_id"),
                    "router_id": row.get("router_id"),
                    "package_id": row.get("package_id"),
                    "buyer_id": row.get("buyer_id"),
                    "amount": float(row.get("amount") or 0),
                    "payment_gateway": row.get("payment_gateway"),
                    "gateway_reference": row.get("gateway_reference"),
                    "status": row.get("status"),
                    "auth_token": row.get("auth_token"),
                    "created_at": row.get("created_at"),
                    "buyer_mac": row.get("buyer_mac"),
                    "phone_number": row.get("phone_number"),
                }
            )

        return ledger_collection

    # ================================================================
    # TENANT INCOME STATS
    # ================================================================

    async def get_tenant_income_stats(
        self,
        tenant_id: int
    ) -> Dict[str, Any]:

        return await self.payment_controller.get_income_stats(tenant_id)
