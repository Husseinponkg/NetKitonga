import os
import secrets
import requests
import asyncio
from datetime import datetime, timedelta
from fastapi import HTTPException
from config.db import connection
from services.payments import PaymentService


class SubscriptionController:
    AMOUNT = 10000.00

    async def get_status(self, tenant_id: int) -> dict:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT subscription_status, subscription_expires_at FROM tenants WHERE id = %s;",
                    (tenant_id,),
                )
                row = await cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Tenant not found.")
                status, expires = row
                active = status == "active" and expires is not None and expires > datetime.utcnow()
                return {
                    "subscription_status": status,
                    "subscription_expires_at": expires.isoformat() if expires else None,
                    "active": active,
                    "amount": self.AMOUNT,
                }
        finally:
            await conn.close()

    async def checkout(self, tenant_id: int, phone_number: str, provider: str) -> dict:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT id FROM tenants WHERE id = %s;", (tenant_id,))
                if not await cursor.fetchone():
                    raise HTTPException(status_code=404, detail="Tenant not found.")

            external_id = f"NETKITONGA-SUB-{secrets.token_hex(8).upper()}"
            auth_token = secrets.token_urlsafe(32)

            await cursor.execute(
                "UPDATE tenants SET subscription_reference = %s, subscription_auth_token = %s, subscription_status = 'pending' WHERE id = %s;",
                (external_id, auth_token, tenant_id),
            )
            await conn.commit()

            # AzamPay checkout
            payment_service = PaymentService()
            phone = payment_service._normalize_phone(phone_number)
            provider_norm = payment_service._normalize_provider(provider)
            token = await asyncio.to_thread(payment_service._get_bearer_token)

            payload = {
                "accountNumber": phone,
                "additionalProperties": {"property1": None, "property2": None},
                "amount": str(self.AMOUNT),
                "currency": "TZS",
                "externalId": external_id,
                "provider": provider_norm,
            }
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {token}",
            }
            if payment_service.api_key:
                headers["X-API-Key"] = payment_service.api_key

            response = await asyncio.to_thread(
                requests.post, payment_service.checkout_url, json=payload, headers=headers, timeout=(10, payment_service.checkout_timeout)
            )
            try:
                body = response.json()
            except ValueError:
                body = {"message": response.text}

            if response.status_code not in (200, 201, 202) or body.get("success") is False:
                raise HTTPException(status_code=502, detail=body.get("message") or "Subscription checkout failed.")

            return {"message": "Subscription checkout initiated.", "reference": external_id}
        finally:
            await conn.close()

    async def callback(self, payload: dict) -> dict:
        external_id = payload.get("externalId") or payload.get("external_id")
        status = str(payload.get("status", "")).lower()
        if not external_id:
            raise HTTPException(status_code=400, detail="Missing reference.")

        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id FROM tenants WHERE subscription_reference = %s;",
                    (external_id,),
                )
                row = await cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Subscription reference not found.")
                tenant_id = row[0]

                if status in {"success", "successful", "completed", "approved"}:
                    expires = datetime.utcnow() + timedelta(days=30)
                    await cursor.execute(
                        "UPDATE tenants SET subscription_status = 'active', subscription_expires_at = %s WHERE id = %s;",
                        (expires, tenant_id),
                    )
                else:
                    await cursor.execute(
                        "UPDATE tenants SET subscription_status = 'expired' WHERE id = %s;",
                        (tenant_id,),
                    )
                await conn.commit()
                return {"status": "acknowledged"}
        finally:
            await conn.close()
