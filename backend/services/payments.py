import os
import secrets
import sys
from pathlib import Path
import requests
from typing import List, Dict, Any
from fastapi import HTTPException, status

backend_dir = str(Path(__file__).resolve().parents[1])
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from config.db import connection
from models.payments import CheckoutRequest, PortalBuyerRequest

class PaymentService:
    def __init__(self):
        # Use explicit endpoint overrides first, then the sandbox bases from .env.
        auth_base_url = os.getenv(
            "AUTHENTICATOR_SANDBOX_BASE_URL",
            os.getenv("Authenticator_Sandbox_Base_Url", "https://authenticator-sandbox.azampay.co.tz"),
        ).rstrip("/")
        checkout_base_url = os.getenv(
            "AZAMPAY_SANDBOX_CHECKOUT_BASE_URL",
            os.getenv("Azampay_Sandbox_Checkout_Base_Url", "https://sandbox.azampay.co.tz"),
        ).rstrip("/")
        self.auth_url = os.getenv(
            "AZAMPAY_AUTH_URL",
            f"{auth_base_url}/AppRegistration/GenerateToken",
        )
        self.checkout_url = os.getenv(
            "AZAMPAY_CHECKOUT_URL",
            f"{checkout_base_url}/api/azampay/mno/checkout",
        )
        
        # Pull parameters dynamically from your central environment (.env)
        self.app_name = os.getenv("AZAMPAY_APP_NAME")
        self.client_id = os.getenv("AZAMPAY_CLIENT_ID")
        self.client_secret = os.getenv("AZAMPAY_CLIENT_SECRET")

    def _validate_configuration(self) -> None:
        if not all((self.app_name, self.client_id, self.client_secret)):
            raise HTTPException(status_code=500, detail="AzamPay credentials are not configured on the server.")

    def _get_bearer_token(self) -> str:
        """Requests a fresh OAuth authorization token from AzamPay security servers."""
        self._validate_configuration()
        payload = {
            "appName": self.app_name,
            "clientId": self.client_id,
            "clientSecret": self.client_secret
        }
        headers = {"Content-Type": "application/json"}
        try:
            response = requests.post(self.auth_url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                body = response.json()
                token = body.get("token") or body.get("accessToken")
                if isinstance(body.get("data"), dict):
                    token = token or body["data"].get("token") or body["data"].get("accessToken")
                if token:
                    return token
                raise HTTPException(status_code=502, detail="AzamPay returned no authorization token.")
            raise HTTPException(status_code=502, detail="AzamPay credentials rejected or token generation flatlined.")
        except requests.exceptions.RequestException as err:
            raise HTTPException(status_code=502, detail=f"Failed to dial AzamPay security layers: {str(err)}")

    async def initiate_mno_checkout(self, data: CheckoutRequest) -> Dict[str, Any]:
        """Saves a pending ledger transaction row and immediately fires a USSD payment prompt."""
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                # 1. Pull the package cost boundary constraints
                await cursor.execute("SELECT price FROM packages WHERE id = %s;", (data.package_id,))
                package_row = await cursor.fetchone()
                if not package_row:
                    raise HTTPException(status_code=404, detail="Target internet package bundle layout missing.")
                
                amount = package_row[0]
                
                # 2. Generate secure unique system reference hashes
                external_id = f"NETKITONGA-{secrets.token_hex(8).upper()}"
                auth_token = secrets.token_urlsafe(32) # Sent back to clear login blocks on the captive portal
                
                # 3. Log the initial transaction into the payments ledger
                query = """
                    INSERT INTO payments (
                        tenant_id, branch_id, router_id, package_id, buyer_id,
                        amount, payment_gateway, gateway_reference, status, auth_token
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'AzamPay', %s, 'pending', %s)
                    RETURNING id;
                """
                params = (
                    data.tenant_id, data.branch_id, data.router_id, data.package_id,
                    data.buyer_id, amount, external_id, auth_token
                )
                await cursor.execute(query, params)
                new_payment_id = (await cursor.fetchone())[0]
                await conn.commit()

                # 4. Fetch the secure authentication token
                token = self._get_bearer_token()
                
                # 5. Build payment payload context exactly matching the AzamPay payload structure
                payload = {
                    "accountNumber": data.phone_number,
                    "additionalProperties": {},
                    "amount": float(amount),
                    "currency": "TZS",
                    "externalId": external_id,
                    "provider": data.provider
                }
                
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
                
                # 6. Execute direct outbound network MNO checkout trigger
                response = requests.post(self.checkout_url, json=payload, headers=headers, timeout=15)
                
                if response.status_code in (200, 201, 202):
                    return {
                        "status": "pending",
                        "payment_id": new_payment_id,
                        "gateway_reference": external_id,
                        "auth_token": auth_token,
                        "message": "AzamPay transaction initiated. Please enter your mobile money PIN to connect."
                    }
                else:
                    # Update local database status record if the gateway rejects parameters explicitly
                    await cursor.execute("UPDATE payments SET status = 'failed' WHERE id = %s;", (new_payment_id,))
                    await conn.commit()
                    raise HTTPException(status_code=400, detail=f"AzamPay push prompt rejected: {response.text}")
                    
        except Exception as e:
            await conn.rollback()
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=500, detail=f"Checkout execution exception trace: {str(e)}")
        finally:
            await conn.close()

    async def register_portal_buyer(self, data: PortalBuyerRequest) -> int:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = """
                    INSERT INTO buyers (tenant_id, buyer_mac, phone_number)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (tenant_id, buyer_mac)
                    DO UPDATE SET phone_number = EXCLUDED.phone_number
                    RETURNING id;
                """
                await cursor.execute(query, (data.tenant_id, data.buyer_mac, data.phone_number))
                buyer_id = (await cursor.fetchone())[0]
                await conn.commit()
                return buyer_id
        except Exception:
            await conn.rollback()
            raise
        finally:
            await conn.close()

    async def get_tenant_payment_history(self, tenant_id: int) -> List[Dict[str, Any]]:
        """Executes an advanced SQL JOIN query to pull histories matching tenant isolation boundaries."""
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                # Performed relational inner join to resolve device MAC definitions from the buyers table
                query = """
                    SELECT 
                        p.id, p.tenant_id, p.branch_id, p.router_id, p.package_id, p.buyer_id,
                        p.amount, p.payment_gateway, p.gateway_reference, p.status, p.auth_token, p.created_at,
                        b.buyer_mac, b.phone_number
                    FROM payments p
                    INNER JOIN buyers b ON p.buyer_id = b.id
                    WHERE p.tenant_id = %s
                    ORDER BY p.created_at DESC;
                """
                await cursor.execute(query, (tenant_id,))
                rows = await cursor.fetchall()
                
                ledger_collection = []
                for row in rows:
                    ledger_collection.append({
                        "id": row[0], "tenant_id": row[1], "branch_id": row[2],
                        "router_id": row[3], "package_id": row[4], "buyer_id": row[5],
                        "amount": float(row[6]), "payment_gateway": row[7],
                        "gateway_reference": row[8], "status": row[9],
                        "auth_token": row[10], "created_at": row[11],
                        "buyer_mac": row[12], "phone_number": row[13]
                    })
                return ledger_collection
        finally:
            await conn.close()

    async def get_tenant_income_stats(self, tenant_id: int) -> Dict[str, Any]:
        """Aggregates total revenue, pending, failed, and count metrics for a tenant."""
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT 
                        COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
                        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) AS completed_total,
                        COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
                        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending_total,
                        COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
                        COALESCE(SUM(amount) FILTER (WHERE status = 'failed'), 0) AS failed_total,
                        COUNT(*) AS total_count,
                        COALESCE(SUM(amount), 0) AS total_amount
                    FROM payments
                    WHERE tenant_id = %s;
                """, (tenant_id,))
                row = await cursor.fetchone()
                if not row:
                    return {
                        "completed_count": 0, "completed_total": 0,
                        "pending_count": 0, "pending_total": 0,
                        "failed_count": 0, "failed_total": 0,
                        "total_count": 0, "total_amount": 0
                    }
                return {
                    "completed_count": row[0] or 0,
                    "completed_total": float(row[1] or 0),
                    "pending_count": row[2] or 0,
                    "pending_total": float(row[3] or 0),
                    "failed_count": row[4] or 0,
                    "failed_total": float(row[5] or 0),
                    "total_count": row[6] or 0,
                    "total_amount": float(row[7] or 0)
                }
        finally:
            await conn.close()
