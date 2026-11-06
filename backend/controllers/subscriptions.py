import os
import secrets
import requests
import asyncio
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from config.db import connection
from services.payments import PaymentService
from controllers.payments import PaymentController


class SubscriptionController:
    AMOUNT = 10000.00

    async def get_status(self, tenant_id: int) -> dict:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT subscription_status, subscription_expires_at, created_at FROM tenants WHERE id = %s;",
                    (tenant_id,),
                )
                row = await cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Tenant not found.")
                status, expires, created_at = row
                await cursor.execute(
                    """
                    SELECT status
                    FROM subscription_payments
                    WHERE tenant_id = %s
                    ORDER BY created_at DESC, id DESC
                    LIMIT 1;
                    """,
                    (tenant_id,),
                )
                latest_payment = await cursor.fetchone()
                now = datetime.now(timezone.utc).replace(tzinfo=None)
                trial_ends_at = created_at + timedelta(days=30)
                paid_active = status == "active" and expires is not None and expires > now
                trial_active = not paid_active and now < trial_ends_at
                effective_status = "active" if paid_active else "trial" if trial_active else "expired"
                return {
                    "subscription_status": effective_status,
                    "subscription_expires_at": expires.isoformat() if expires else None,
                    "trial_ends_at": trial_ends_at.isoformat(),
                    "active": paid_active or trial_active,
                    "amount": self.AMOUNT,
                    "payment_status": latest_payment[0] if latest_payment else None,
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
                    "UPDATE tenants SET subscription_reference = %s, subscription_auth_token = %s WHERE id = %s;",
                    (external_id, auth_token, tenant_id),
                )
                await cursor.execute(
                    """
                    INSERT INTO subscription_payments (tenant_id, amount, payment_reference, status)
                    VALUES (%s, %s, %s, 'pending');
                    """,
                    (tenant_id, self.AMOUNT, external_id),
                )
                await conn.commit()
        except HTTPException:
            raise
        except Exception as error:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Could not create subscription payment: {error}")
        finally:
            await conn.close()

        checkout_started = False
        try:
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

            checkout_started = True
            response = await asyncio.to_thread(
                requests.post, payment_service.checkout_url, json=payload, headers=headers, timeout=(10, payment_service.checkout_timeout)
            )
            try:
                body = response.json()
            except ValueError:
                body = {"message": response.text}

            if response.status_code >= 500:
                raise HTTPException(
                    status_code=502,
                    detail={
                        "message": "Subscription checkout outcome is unconfirmed; check payment status before retrying.",
                        "reference": external_id,
                        "status": "pending",
                    },
                )
            if response.status_code not in (200, 201, 202) or body.get("success") is False:
                raise HTTPException(status_code=502, detail=body.get("message") or "Subscription checkout failed.")

            return {
                "status": "pending",
                "message": "Checkout request was received. Awaiting confirmed payment status.",
                "reference": external_id,
            }
        except requests.exceptions.RequestException as error:
            if not checkout_started:
                await self._set_payment_status(external_id, "failed")
            raise HTTPException(
                status_code=502,
                detail={
                    "message": "Subscription checkout outcome is unconfirmed; check payment status before retrying.",
                    "reference": external_id,
                    "status": "pending",
                },
            ) from error
        except HTTPException as error:
            if not (
                isinstance(error.detail, dict)
                and error.detail.get("status") == "pending"
            ) and "unconfirmed" not in str(error.detail).lower():
                await self._set_payment_status(external_id, "failed")
            raise
        except Exception:
            await self._set_payment_status(external_id, "failed")
            raise

    async def _set_payment_status(self, reference: str, status: str) -> None:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE subscription_payments SET status = %s WHERE payment_reference = %s AND status = 'pending';",
                    (status, reference),
                )
                await conn.commit()
        except Exception:
            await conn.rollback()
            raise
        finally:
            await conn.close()

    async def callback(self, payload: dict) -> dict:
        external_id = (
            payload.get("utilityref")
            or payload.get("externalId")
            or payload.get("external_id")
        )
        external_reference = (
            payload.get("externalreference")
            or payload.get("externalReference")
            or payload.get("external_reference")
            or payload.get("reference")
        )
        operator = (
            payload.get("operator")
            or payload.get("paymentOperator")
            or payload.get("payment_operator")
        )
        signature = payload.get("signature") or payload.get("sign")
        raw_status = (
            payload.get("transactionstatus")
            or payload.get("transactionStatus")
            or payload.get("transaction_status")
            or payload.get("status")
        )
        status = str(raw_status or "").strip().lower()
        if not external_id:
            raise HTTPException(status_code=400, detail="Missing reference.")
        successful_statuses = {"success", "successful", "completed", "approved", "paid"}
        failed_statuses = {"failure", "failed", "unsuccessful", "rejected", "cancelled", "canceled"}
        if status not in successful_statuses | failed_statuses:
            raise HTTPException(status_code=400, detail="Unrecognized subscription payment status.")
        await PaymentController().verify_callback_signature(
            str(external_id),
            str(external_reference) if external_reference else None,
            str(raw_status),
            str(operator) if operator else None,
            str(signature) if signature else None,
        )

        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT id, tenant_id, status
                    FROM subscription_payments
                    WHERE payment_reference = %s
                    FOR UPDATE;
                    """,
                    (external_id,),
                )
                payment = await cursor.fetchone()
                if not payment:
                    raise HTTPException(status_code=404, detail="Subscription reference not found.")
                payment_id, tenant_id, payment_status = payment
                if payment_status != "pending":
                    await conn.commit()
                    return {"status": "acknowledged"}

                if status in successful_statuses:
                    await cursor.execute(
                        """
                        UPDATE tenants
                        SET subscription_status = 'active',
                            subscription_expires_at =
                                GREATEST(
                                    COALESCE(subscription_expires_at, created_at + INTERVAL '30 days'),
                                    NOW()
                                ) + INTERVAL '30 days'
                        WHERE id = %s;
                        """,
                        (tenant_id,),
                    )
                    await cursor.execute(
                        """
                        UPDATE subscription_payments
                        SET status = 'completed', paid_at = NOW()
                        WHERE id = %s;
                        """,
                        (payment_id,),
                    )
                else:
                    await cursor.execute(
                        "UPDATE subscription_payments SET status = 'failed' WHERE id = %s;",
                        (payment_id,),
                    )
                await conn.commit()
                return {"status": "acknowledged"}
        except HTTPException:
            raise
        except Exception as error:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Subscription callback failed: {error}")
        finally:
            await conn.close()
