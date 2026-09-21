from config.db import connection
from typing import Dict, Any, List
from fastapi import HTTPException

class PaymentController:
    async def get_package_price(self, package_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT price FROM packages WHERE id = %s;", (package_id,))
                row = await cursor.fetchone()
                if not row:
                    return {}
                return {"price": row[0]}
        finally:
            await conn.close()

    async def create_pending_payment(self, payment_data: Dict[str, Any]) -> int:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = """
                    INSERT INTO payments (
                        tenant_id, branch_id, router_id, package_id, buyer_id,
                        amount, payment_gateway, gateway_reference, status, auth_token
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'AzamPay', %s, 'pending', %s)
                    RETURNING id;
                """
                params = (
                    payment_data["tenant_id"],
                    payment_data["branch_id"],
                    payment_data["router_id"],
                    payment_data["package_id"],
                    payment_data["buyer_id"],
                    payment_data["amount"],
                    payment_data["gateway_reference"],
                    payment_data["auth_token"],
                )
                await cursor.execute(query, params)
                payment_row = await cursor.fetchone()
                if not payment_row:
                    raise HTTPException(status_code=500, detail="Failed to create payment record.")
                await conn.commit()
                return payment_row[0]
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def register_portal_buyer(self, buyer_data: Dict[str, Any]) -> int:
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
                await cursor.execute(query, (buyer_data["tenant_id"], buyer_data["buyer_mac"], buyer_data["phone_number"]))
                buyer_row = await cursor.fetchone()
                if not buyer_row:
                    raise HTTPException(status_code=500, detail="Failed to register portal buyer.")
                await conn.commit()
                return buyer_row[0]
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def get_payment_history(self, tenant_id: int) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
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
                cols = [d[0] for d in (cursor.description or [])]
                return [dict(zip(cols, r)) for r in rows]
        finally:
            await conn.close()

    async def get_income_stats(self, tenant_id: int) -> Dict[str, Any]:
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

    async def mark_payment_failed(self, payment_id: int) -> None:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("UPDATE payments SET status = 'failed' WHERE id = %s;", (payment_id,))
                await conn.commit()
        except Exception:
            await conn.rollback()
            raise
        finally:
            await conn.close()

    async def create_active_session(self, session_data: Dict[str, Any]) -> int:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = """
                    INSERT INTO active_sessions (
                        tenant_id, router_id, buyer_id, payment_id,
                        session_id, assigned_ip, bytes_uploaded, bytes_downloaded,
                        start_time, expiration_time, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, 0, 0, NOW(), NOW() + INTERVAL '1 second' * %s, 'active')
                    RETURNING id;
                """
                params = (
                    session_data["tenant_id"],
                    session_data["router_id"],
                    session_data["buyer_id"],
                    session_data.get("payment_id"),
                    session_data["session_id"],
                    session_data["assigned_ip"],
                    session_data["duration_seconds"],
                )
                await cursor.execute(query, params)
                session_row = await cursor.fetchone()
                if not session_row:
                    raise HTTPException(status_code=500, detail="Failed to create active session.")
                await conn.commit()
                return session_row[0]
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def process_asynchronous_callback(self, external_id: str, is_successful: bool) -> bool:
        """
        Processes AzamPay background asynchronous webhooks.
        Updates transaction states and updates active tenant wallet balances.
        """
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                # 1. Fetch current transaction payload context parameters safely
                query = "SELECT id, tenant_id, amount, status FROM payments WHERE gateway_reference = %s;"
                await cursor.execute(query, (external_id,))
                payment_row = await cursor.fetchone()

                # Validation barrier: check if the row exists and is currently in a pending state
                if not payment_row or payment_row[3] != 'pending':
                    return False

                payment_id, tenant_id, amount, _ = payment_row
                resolved_status = 'completed' if is_successful else 'failed'

                # 2. Persist the final transaction status update into the PostgreSQL database layer
                update_payment_query = "UPDATE payments SET status = %s WHERE id = %s;"
                await cursor.execute(update_payment_query, (resolved_status, payment_id))

                # 3. If verified successful, execute ledger balance updates to fund the tenant wallet account.
                # Upsert (INSERT ... ON CONFLICT) instead of a bare UPDATE: if a
                # tenant_wallets row doesn't already exist for this tenant, a plain
                # UPDATE silently affects 0 rows and the money is never tracked
                # anywhere even though the payment itself gets marked completed.
                if resolved_status == 'completed':
                    wallet_upsert_query = """
                        INSERT INTO tenant_wallets (tenant_id, total_earned, current_balance, updated_at)
                        VALUES (%s, %s, %s, NOW())
                        ON CONFLICT (tenant_id) DO UPDATE
                        SET total_earned = tenant_wallets.total_earned + EXCLUDED.total_earned,
                            current_balance = tenant_wallets.current_balance + EXCLUDED.current_balance,
                            updated_at = NOW();
                    """
                    await cursor.execute(wallet_upsert_query, (tenant_id, amount, amount))

                    payment_query = "SELECT tenant_id, branch_id, router_id, package_id, buyer_id FROM payments WHERE id = %s;"
                    await cursor.execute(payment_query, (payment_id,))
                    payment_context = await cursor.fetchone()
                    if payment_context:
                        p_tenant_id, p_branch_id, p_router_id, p_package_id, p_buyer_id = payment_context
                        duration_query = "SELECT duration_seconds FROM packages WHERE id = %s;"
                        await cursor.execute(duration_query, (p_package_id,))
                        duration_row = await cursor.fetchone()
                        duration_seconds = duration_row[0] if duration_row else 86400

                        session_query = """
                            INSERT INTO active_sessions (
                                tenant_id, router_id, buyer_id, payment_id,
                                session_id, assigned_ip, bytes_uploaded, bytes_downloaded,
                                start_time, expiration_time, status
                            ) VALUES (%s, %s, %s, %s, %s, %s, 0, 0, NOW(), NOW() + INTERVAL '1 second' * %s, 'active')
                            RETURNING id;
                        """
                        session_id = f"PAY-{payment_id}-{p_buyer_id}"
                        await cursor.execute(session_query, (
                            p_tenant_id, p_router_id, p_buyer_id, payment_id,
                            session_id, "0.0.0.0", duration_seconds
                        ))

                # Commit all structural changes to PostgreSQL together
                await conn.commit()
                return True

        except Exception as e:
            await conn.rollback()
            print(f"Callback accounting processing engine error: {str(e)}")
            return False
        finally:
            await conn.close() # Clean async connection slot release
