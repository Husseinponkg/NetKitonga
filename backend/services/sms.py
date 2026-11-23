import os
import requests
from typing import Any, Dict, List
from fastapi import HTTPException
from config.db import connection


class SMSService:
    def __init__(self):
        self.base_url = os.getenv("NEXTSMS_BASE_URL", "https://messaging-service.co.tz")
        self.api_token = os.getenv("NEXTSMS_API_TOKEN", "")
        self.sender_id = os.getenv("NEXTSMS_SENDER_ID", "")
        self.cost_per_sms = int(os.getenv("NEXTSMS_COST_PER_SMS", "5"))
        self.sell_price = int(os.getenv("NEXTSMS_SELL_PRICE", "20"))

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

    async def get_credits(self, tenant_id: int) -> int:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "INSERT INTO sms_credits (tenant_id, balance) VALUES (%s, 0) ON CONFLICT (tenant_id) DO NOTHING;",
                    (tenant_id,),
                )
                await conn.commit()
                await cursor.execute("SELECT balance FROM sms_credits WHERE tenant_id = %s;", (tenant_id,))
                row = await cursor.fetchone()
                return int(row[0]) if row else 0
        finally:
            await conn.close()

    async def add_credits(self, tenant_id: int, count: int) -> int:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "INSERT INTO sms_credits (tenant_id, balance) VALUES (%s, %s) ON CONFLICT (tenant_id) DO UPDATE SET balance = sms_credits.balance + %s, updated_at = NOW();",
                    (tenant_id, count, count),
                )
                await conn.commit()
                await cursor.execute("SELECT balance FROM sms_credits WHERE tenant_id = %s;", (tenant_id,))
                row = await cursor.fetchone()
                return int(row[0]) if row else count
        finally:
            await conn.close()

    async def deduct_credits(self, tenant_id: int, count: int) -> bool:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT balance FROM sms_credits WHERE tenant_id = %s FOR UPDATE;",
                    (tenant_id,),
                )
                row = await cursor.fetchone()
                balance = int(row[0]) if row else 0
                if balance < count:
                    return False
                await cursor.execute(
                    "UPDATE sms_credits SET balance = balance - %s, updated_at = NOW() WHERE tenant_id = %s;",
                    (count, tenant_id),
                )
                await conn.commit()
                return True
        finally:
            await conn.close()

    def check_balance(self) -> Dict[str, Any]:
        if not self.api_token:
            raise HTTPException(status_code=500, detail="NextSMS API token not configured.")
        url = f"{self.base_url}/api/v2/balance"
        try:
            response = requests.get(url, headers=self._headers(), timeout=15)
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

    def send_single(self, phone_numbers: List[str], text: str, reference: str = "") -> Dict[str, Any]:
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
