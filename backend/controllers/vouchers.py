import secrets
from datetime import datetime
from typing import List, Dict, Any

from fastapi import HTTPException

from config.db import connection
from models.vouchers import VoucherCreate, VoucherResponse, VoucherRedeem
from services.vouchers import VoucherService


class VoucherController:
    def __init__(self):
        self.service = VoucherService()

    async def create(self, tenant_id: int, data: VoucherCreate) -> List[dict]:
        try:
            return await self.service.create_vouchers(tenant_id, data)
        except ValueError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    async def list(self, tenant_id: int) -> List[dict]:
        return await self.service.list_vouchers(tenant_id)

    async def redeem(self, tenant_id: int, data: VoucherRedeem) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await self.service._ensure_table(cursor)

                await cursor.execute("""
                    SELECT v.id, v.package_id, v.status, v.expires_at, p.duration_seconds
                    FROM vouchers v
                    JOIN packages p ON p.id = v.package_id AND p.tenant_id = v.tenant_id
                    WHERE v.tenant_id = %s AND v.code = %s
                    FOR UPDATE;
                """, (tenant_id, data.code))
                voucher = await cursor.fetchone()

                if not voucher:
                    raise HTTPException(status_code=404, detail="Voucher not found.")

                voucher_id, package_id, status, expires_at, duration_seconds = voucher

                if status != "unused":
                    raise HTTPException(status_code=400, detail="Voucher has already been redeemed.")

                if expires_at and expires_at < datetime.utcnow():
                    raise HTTPException(status_code=400, detail="Voucher has expired.")

                if not duration_seconds or duration_seconds <= 0:
                    duration_seconds = 86400

                package_price_row = await cursor.execute(
                    "SELECT price FROM packages WHERE id = %s;",
                    (package_id,),
                )
                price_row = await cursor.fetchone()
                package_price = float(price_row[0]) if price_row else 0.0

                gateway_reference = f"VOUCHER-{secrets.token_hex(8).upper()}"
                auth_token = secrets.token_urlsafe(32)

                await cursor.execute(
                    """
                    INSERT INTO payments (
                        tenant_id, branch_id, router_id, package_id, buyer_id,
                        amount, payment_gateway, gateway_reference, status, auth_token
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'Voucher', %s, 'completed', %s)
                    RETURNING id;
                    """,
                    (
                        tenant_id,
                        0,
                        data.router_id,
                        package_id,
                        0,
                        package_price,
                        gateway_reference,
                        auth_token,
                    ),
                )
                payment_row = await cursor.fetchone()
                payment_id = payment_row[0]

                await cursor.execute(
                    """
                    UPDATE vouchers
                    SET status = 'used', redeemed_at = NOW()
                    WHERE id = %s;
                    """,
                    (voucher_id,),
                )

                await cursor.execute(
                    """
                    INSERT INTO active_sessions (
                        tenant_id, router_id, buyer_id, payment_id,
                        session_id, assigned_ip, bytes_uploaded, bytes_downloaded,
                        start_time, expiration_time, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, 0, 0, NOW(), NOW() + INTERVAL '1 second' * %s, 'active')
                    RETURNING id;
                    """,
                    (
                        tenant_id,
                        data.router_id,
                        0,
                        payment_id,
                        f"VOUCHER-{voucher_id}-{data.buyer_mac}",
                        data.assigned_ip or "0.0.0.0",
                        duration_seconds,
                    ),
                )

                wallet_upsert_query = """
                    INSERT INTO tenant_wallets (tenant_id, total_earned, current_balance, updated_at)
                    VALUES (%s, %s, %s, NOW())
                    ON CONFLICT (tenant_id) DO UPDATE
                    SET total_earned = tenant_wallets.total_earned + EXCLUDED.total_earned,
                        current_balance = tenant_wallets.current_balance + EXCLUDED.current_balance,
                        updated_at = NOW();
                """
                await cursor.execute(wallet_upsert_query, (tenant_id, package_price, package_price))

                await conn.commit()
                return {
                    "message": "Voucher redeemed successfully.",
                    "session_duration_seconds": duration_seconds,
                    "package_id": package_id,
                }
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()
