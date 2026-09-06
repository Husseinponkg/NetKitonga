import os
import time
import requests
from typing import Any, Dict
from fastapi import HTTPException
from services.payments import PaymentService


class DisbursementService:
    def __init__(self):
        self.url = os.getenv(
            "AZAMPAY_DISBURSEMENT_URL",
            "https://api-disbursement-sandbox.azampay.co.tz/api/v1/azampay/disburse",
        )
        self.source_country = os.getenv("AZAMPAY_SOURCE_COUNTRY_CODE", "TZ")
        self.source_name = os.getenv("AZAMPAY_SOURCE_FULL_NAME")
        self.source_bank = os.getenv("AZAMPAY_SOURCE_BANK_NAME")
        self.source_account = os.getenv("AZAMPAY_SOURCE_ACCOUNT_NUMBER")
        self.source_currency = os.getenv("AZAMPAY_SOURCE_CURRENCY", "TZS")
        self.checksum = os.getenv("AZAMPAY_DISBURSEMENT_CHECKSUM")

    def _validate_configuration(self) -> None:
        if not all((self.source_name, self.source_bank, self.source_account, self.checksum)):
            raise HTTPException(
                status_code=500,
                detail="AzamPay disbursement settings are incomplete on the server.",
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

    def send(self, amount: float, phone_number: str, provider: str, reference: str) -> Dict[str, Any]:
        self._validate_configuration()
        token = PaymentService()._get_bearer_token()
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
            "checksum": self.checksum,
            "remarks": "Net Kitonga tenant withdrawal",
        }
        try:
            response = requests.post(
                self.url,
                json=payload,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
                timeout=20,
            )
        except requests.exceptions.RequestException as error:
            raise HTTPException(status_code=502, detail=f"AzamPay disbursement connection failed: {error}")

        try:
            body = response.json()
        except ValueError:
            body = {"message": response.text}
        if response.status_code not in (200, 201, 202) or body.get("success") is False:
            raise HTTPException(status_code=502, detail=f"AzamPay disbursement rejected: {body.get('message', response.text)}")
        return body