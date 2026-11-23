import os
import requests
from typing import Any, Dict, List
from fastapi import HTTPException


class SMSService:
    def __init__(self):
        self.base_url = os.getenv("NEXTSMS_BASE_URL", "https://messaging-service.co.tz")
        self.api_token = os.getenv("NEXTSMS_API_TOKEN", "")
        self.sender_id = os.getenv("NEXTSMS_SENDER_ID", "")

    def _headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_token}",
        }

    def _normalize(self, num: str) -> str:
        n = str(num).strip().replace("+", "").replace(" ", "")
        if n.startswith("0"):
            n = "255" + n[1:]
        return n

    def send_single(self, phone_numbers: List[str], text: str, reference: str = "") -> Dict[str, Any]:
        """Send the same text to multiple recipients via /mobile/v2/text/single."""
        if not self.api_token:
            raise HTTPException(status_code=500, detail="NextSMS API token not configured.")
        if not phone_numbers or not text:
            raise HTTPException(status_code=400, detail="Phone numbers and text are required.")

        normalized = [self._normalize(n) for n in phone_numbers]

        url = f"{self.base_url}/api/mobile/v2/text/single"
        payload: Dict[str, Any] = {
            "to": normalized,
            "text": text,
        }
        if self.sender_id:
            payload["from"] = self.sender_id
        if reference:
            payload["reference"] = reference

        try:
            response = requests.post(url, json=payload, headers=self._headers(), timeout=30)
        except requests.exceptions.RequestException as error:
            raise HTTPException(status_code=502, detail=f"NextSMS connection failed: {error}")

        try:
            body = response.json()
        except ValueError:
            body = {"message": response.text}

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"NextSMS rejected: {body.get('message', response.text)[:300]}",
            )
        return body

    def send_multi(self, messages: List[Dict[str, str]], reference: str = "") -> Dict[str, Any]:
        """Send different texts to different recipients via /mobile/v2/text/multi."""
        if not self.api_token:
            raise HTTPException(status_code=500, detail="NextSMS API token not configured.")
        if not messages:
            raise HTTPException(status_code=400, detail="Messages list is required.")

        normalized_messages = []
        for m in messages:
            normalized_messages.append({
                "to": self._normalize(m["to"]),
                "text": m["text"],
            })

        url = f"{self.base_url}/api/mobile/v2/text/multi"
        payload: Dict[str, Any] = {
            "messages": normalized_messages,
        }
        if reference:
            payload["reference"] = reference

        try:
            response = requests.post(url, json=payload, headers=self._headers(), timeout=30)
        except requests.exceptions.RequestException as error:
            raise HTTPException(status_code=502, detail=f"NextSMS connection failed: {error}")

        try:
            body = response.json()
        except ValueError:
            body = {"message": response.text}

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"NextSMS rejected: {body.get('message', response.text)[:300]}",
            )
        return body

