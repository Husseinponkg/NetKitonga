import os
import time
import requests
from typing import Any, Dict
from urllib.parse import quote
from fastapi import HTTPException
from services.payments import PaymentService


class DisbursementRejected(Exception):
    """Raised when AzamPay explicitly rejects a disbursement request."""


class DisbursementPreflightError(Exception):
    """Raised when a disbursement cannot be sent before reaching the payout API."""


class DisbursementService:
    def __init__(self):
        self.url = os.getenv(
            "AZAMPAY_DISBURSEMENT_URL",
            "https://api-disbursement-sandbox.azampay.co.tz/api/v1/azampay/disburse",
        )
        self.bank_names_url = os.getenv(
            "AZAMPAY_BANK_NAMES_URL",
            "https://api-disbursement.azampay.co.tz/api/v1/azampay/BankNames",
        )
        self.check_balance_url = os.getenv(
            "AZAMPAY_CHECK_BALANCE_URL",
            "https://api-disbursement.azampay.co.tz/api/v1/azampay/checkbalance",
        ).rstrip("/")
        self.transaction_status_url = os.getenv(
            "AZAMPAY_TRANSACTION_STATUS_URL",
            "https://api-disbursement.azampay.co.tz/api/v1/azampay/transactionstatus",
        )
        self.app_name = os.getenv("AZAMPAY_DISBURSEMENT_APP_NAME", os.getenv("AZAMPAY_APP_NAME"))
        self.client_id = os.getenv("AZAMPAY_DISBURSEMENT_CLIENT_ID", os.getenv("AZAMPAY_CLIENT_ID"))
        self.client_secret = os.getenv("AZAMPAY_DISBURSEMENT_CLIENT_SECRET", os.getenv("AZAMPAY_CLIENT_SECRET"))
        self.api_key = os.getenv("AZAMPAY_DISBURSEMENT_API_KEY", os.getenv("AZAMPAY_API_KEY", os.getenv("AZAMPAY_TOKEN")))
        self.source_country = os.getenv("AZAMPAY_SOURCE_COUNTRY_CODE", "TZ")
        self.source_name = os.getenv("AZAMPAY_SOURCE_FULL_NAME")
        self.source_bank = os.getenv("AZAMPAY_SOURCE_BANK_NAME")
        self.source_account = os.getenv("AZAMPAY_SOURCE_ACCOUNT_NUMBER")
        self.source_currency = os.getenv("AZAMPAY_SOURCE_CURRENCY", "TZS")
        self.checksum = os.getenv(
            "AZAMPAY_DISBURSEMENT_CHECKSUM",
            os.getenv("AZAM_PAY_CHECKSUM", ""),
        )

    def _validate_configuration(self) -> None:
        if not all((self.source_name, self.source_bank, self.source_account)):
            raise DisbursementPreflightError(
                "AzamPay disbursement settings are incomplete. Configure the source name, bank, and account."
            )

    def _provider_bank_name(self, provider: str) -> str:
        providers = {
            "Mpesa": "vodacom",
            "Tigo": "tigo",
            "Airtel": "airtel",
            "Halopesa": "halotel",
            "Azampesa": "azampesa",
        }
        return providers.get(provider, provider.lower())

    def _get_bearer_token(self) -> str:
        import requests as _requests
        payload = {
            "appName": self.app_name,
            "clientId": self.client_id,
            "clientSecret": self.client_secret,
        }
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        auth_url = os.getenv("AZAMPAY_AUTH_URL", "https://authenticator.azampay.co.tz/AppRegistration/GenerateToken")
        # Use disbursement auth URL if provided
        auth_url = os.getenv("AZAMPAY_DISBURSEMENT_AUTH_URL", auth_url)
        try:
            response = _requests.post(auth_url, json=payload, headers=headers, timeout=10)
        except _requests.exceptions.RequestException as error:
            raise DisbursementPreflightError(
                f"AzamPay disbursement authentication connection failed: {error}"
            ) from error
        if response.status_code != 200:
            raise DisbursementPreflightError(
                f"AzamPay disbursement authentication failed with HTTP {response.status_code}."
            )
        try:
            body = response.json()
        except ValueError as error:
            raise DisbursementPreflightError(
                "AzamPay disbursement authentication returned invalid JSON."
            ) from error
        if not isinstance(body, dict):
            raise DisbursementPreflightError(
                "AzamPay disbursement authentication returned an invalid response."
            )
        token = body.get("token") or body.get("accessToken")
        data = body.get("data")
        if isinstance(data, dict):
            token = token or data.get("token") or data.get("accessToken")
        if not token:
            raise DisbursementPreflightError(
                "AzamPay disbursement authentication returned no access token."
            )
        return str(token)

    def _get_inquiry(self, url: str, *, params: Dict[str, str] | None = None, authenticated: bool = True) -> Any:
        headers = {"Accept": "text/plain"}
        if authenticated:
            headers["Authorization"] = f"Bearer {self._get_bearer_token()}"
        try:
            response = requests.get(url, headers=headers, params=params, timeout=15)
        except requests.exceptions.RequestException as error:
            raise HTTPException(
                status_code=502,
                detail=f"AzamPay inquiry connection failed: {error}",
            ) from error

        if not response.ok:
            raise HTTPException(
                status_code=502,
                detail=f"AzamPay inquiry rejected with HTTP {response.status_code}.",
            )
        try:
            return response.json()
        except ValueError:
            return response.text

    def get_bank_names(self) -> Any:
        return self._get_inquiry(self.bank_names_url, authenticated=False)

    def check_balance(self, bank_name: str = "azampesa") -> Any:
        return self._get_inquiry(
            f"{self.check_balance_url}/{quote(bank_name.lower(), safe='')}"
        )

    def get_transaction_status(self, pg_reference_id: str, bank_name: str = "Azampesa") -> Any:
        return self._get_inquiry(
            self.transaction_status_url,
            params={"pgReferenceId": pg_reference_id, "bankName": bank_name},
        )

    def _generate_checksum(self, source_account: str, dest_account: str, currency: str, amount: float, external_reference: str) -> str:
        import time, base64, hashlib
        from cryptography.hazmat.primitives.asymmetric import padding as asym_padding
        from cryptography.hazmat.primitives import serialization, hashes
        from pathlib import Path
        # Load public key from file
        key_path = Path(__file__).resolve().parent.parent / "azampay_public.pem"
        if not key_path.exists():
            key_path = Path(os.getenv("AZAMPAY_PUBLIC_KEY_PATH", "azampay_public.pem"))
        public_key = serialization.load_pem_public_key(key_path.read_bytes())
        epoch = int(time.time())
        input_string = f"{source_account}{dest_account}{currency}{int(amount)}{epoch}{external_reference}"
        sha512_hash = hashlib.sha512(input_string.encode("utf-8")).digest()
        encrypted = public_key.encrypt(sha512_hash, asym_padding.PKCS1v15())
        return base64.b64encode(encrypted).decode("utf-8")

    def send(self, amount: float, phone_number: str, provider: str, reference: str) -> Dict[str, Any]:
        self._validate_configuration()
        token = self._get_bearer_token()
        payload = {
            "source": {
                "countryCode": self.source_country,
                "fullName": self.source_name,
                "bankName": self.source_bank,
                "accountNumber": self.source_account,
                "currency": self.source_currency,
            },
            "destination": {
                "countryCode": "TZ",
                "fullName": phone_number,
                "bankName": self._provider_bank_name(provider),
                "accountNumber": phone_number,
                "currency": "TZS",
            },
            "transferDetails": {
                "type": "mobile_money",
                "amount": amount,
                "dateInEpoch": int(time.time()),
            },
            "externalReferenceId": reference,
            "additionalProperties": {},
            "remarks": "Net Kitonga tenant withdrawal",
        }
        if self.checksum:
            payload["checksum"] = self.checksum
        else:
            try:
                payload["checksum"] = self._generate_checksum(
                    self.source_account,
                    phone_number,
                    "TZS",
                    amount,
                    reference,
                )
            except (OSError, ValueError, TypeError) as error:
                raise DisbursementPreflightError(
                    "Could not prepare the AzamPay disbursement checksum; verify the configured public key."
                ) from error
        try:
            response = requests.post(
                self.url,
                json=payload,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}", "X-API-Key": self.api_key} if self.api_key else {"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
                timeout=20,
            )
        except requests.exceptions.RequestException as error:
            raise HTTPException(
                status_code=502,
                detail=(
                    "AzamPay disbursement connection failed; payout outcome is unconfirmed. "
                    f"Check status before retrying. ({error})"
                ),
            ) from error

        try:
            body = response.json()
        except ValueError:
            body = {"message": response.text}
        if body.get("success") is False or 400 <= response.status_code < 500:
            message = body.get("message", response.text)
            raise DisbursementRejected(
                f"AzamPay disbursement rejected: {str(message)[:300]}"
            )
        if response.status_code not in (200, 201, 202):
            raise HTTPException(
                status_code=502,
                detail=(
                    "AzamPay disbursement outcome is unconfirmed "
                    f"(HTTP {response.status_code})."
                ),
            )
        return body