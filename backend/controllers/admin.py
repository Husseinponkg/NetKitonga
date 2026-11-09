import asyncio
import secrets
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from bcrypt import hashpw, gensalt, checkpw
from config.db import connection
from services.disbursements import (
    DisbursementPreflightError,
    DisbursementRejected,
    DisbursementService,
)
from services.omada import OmadaConfigurationError, OmadaControllerError
from services.omada_sessions import terminate_session as terminate_active_session


class AdminController:
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, email, password_hash, name FROM admins WHERE email = %s",
                    (email,),
                )
                admin = await cursor.fetchone()
                if not admin:
                    raise HTTPException(status_code=400, detail="Invalid admin credentials.")

                admin_id, admin_email, stored_hash, name = admin
                if not stored_hash or not stored_hash.strip():
                    raise HTTPException(status_code=400, detail="Invalid admin credentials.")

                try:
                    password_valid = checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
                except Exception:
                    raise HTTPException(status_code=400, detail="Invalid admin credentials.")

                if not password_valid:
                    raise HTTPException(status_code=400, detail="Invalid admin credentials.")

                return {
                    "message": "Admin login successful",
                    "admin": {
                        "id": admin_id,
                        "email": admin_email,
                        "name": name,
                    },
                }
        finally:
            await conn.close()

    async def list_admins(self) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, email, name, created_at FROM admins ORDER BY id;"
                )
                rows = await cursor.fetchall()
                cols = [d[0] for d in (cursor.description or [])]
                return [dict(zip(cols, r)) for r in rows]
        finally:
            await conn.close()

    async def create_admin(self, name: str, email: str, password: str) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id FROM admins WHERE email = %s;",
                    (email,),
                )
                existing = await cursor.fetchone()
                if existing:
                    raise HTTPException(status_code=400, detail="Admin with this email already exists.")

                hashed_password = hashpw(password.encode("utf-8"), gensalt()).decode("utf-8")
                await cursor.execute(
                    "INSERT INTO admins (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id;",
                    (name, email, hashed_password),
                )
                row = await cursor.fetchone()
                admin_id = row[0]
                await conn.commit()
                return {
                    "message": "Admin created successfully.",
                    "id": admin_id,
                    "email": email,
                    "name": name,
                }
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def update_admin(self, admin_id: int, name: Optional[str], email: Optional[str], password: Optional[str]) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT id FROM admins WHERE id = %s;", (admin_id,))
                if not await cursor.fetchone():
                    raise HTTPException(status_code=404, detail="Admin not found.")

                updates = []
                params: List[Any] = [admin_id]

                if email:
                    updates.append("email = %s")
                    params.append(email)
                if name:
                    updates.append("name = %s")
                    params.append(name)
                if password:
                    hashed_password = hashpw(password.encode("utf-8"), gensalt()).decode("utf-8")
                    updates.append("password_hash = %s")
                    params.append(hashed_password)

                if not updates:
                    raise HTTPException(status_code=400, detail="No update fields provided.")

                query = f"UPDATE admins SET {', '.join(updates)} WHERE id = %s;"
                await cursor.execute(query, tuple(params))
                await conn.commit()
                return {"message": "Admin updated successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def delete_admin(self, admin_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM admins WHERE id = %s RETURNING id;", (admin_id,))
                deleted = await cursor.fetchone()
                if not deleted:
                    raise HTTPException(status_code=404, detail="Admin not found.")
                await conn.commit()
                return {"message": "Admin deleted successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def list_logs(self, tenant_id: Optional[int] = None, limit: int = 100) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = """
                    SELECT l.id, l.tenant_id, t.business_name, l.action, l.entity_type, l.entity_id, l.metadata, l.created_at
                    FROM system_logs l
                    LEFT JOIN tenants t ON t.id = l.tenant_id
                """
                params: List[Any] = []
                if tenant_id:
                    query += " WHERE l.tenant_id = %s"
                    params.append(tenant_id)
                query += " ORDER BY l.created_at DESC LIMIT %s;"
                params.append(limit)
                await cursor.execute(query, tuple(params))
                rows = await cursor.fetchall()
                cols = [d[0] for d in (cursor.description or [])]
                return [dict(zip(cols, r)) for r in rows]
        finally:
            await conn.close()

    async def create_log(self, tenant_id: Optional[int], action: str, entity_type: str, entity_id: Optional[int] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    INSERT INTO system_logs (tenant_id, action, entity_type, entity_id, metadata)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id;
                    """,
                    (tenant_id, action, entity_type, entity_id, metadata),
                )
                row = await cursor.fetchone()
                log_id = row[0]
                await conn.commit()
                return {"message": "Log created successfully.", "id": log_id}
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def delete_log(self, log_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM system_logs WHERE id = %s RETURNING id;", (log_id,))
                deleted = await cursor.fetchone()
                if not deleted:
                    raise HTTPException(status_code=404, detail="Log not found.")
                await conn.commit()
                return {"message": "Log deleted successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def get_stats(self) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("SELECT COUNT(*) FROM tenants;")
                tenants_count = (await cursor.fetchone())[0]

                await cursor.execute("SELECT COUNT(*) FROM routers;")
                routers_count = (await cursor.fetchone())[0]

                await cursor.execute("SELECT COUNT(*) FROM active_sessions WHERE status = 'active' AND expiration_time > NOW();")
                active_sessions_count = (await cursor.fetchone())[0]

                await cursor.execute("""
                    SELECT COALESCE(SUM(amount), 0)
                    FROM payments
                    WHERE status = 'completed'
                      AND DATE(created_at) = CURRENT_DATE;
                """)
                payments_today_sum = float((await cursor.fetchone())[0] or 0)

                return {
                    "tenants": tenants_count,
                    "routers": routers_count,
                    "active_sessions": active_sessions_count,
                    "payments_today": payments_today_sum,
                }
        finally:
            await conn.close()

    async def get_system_revenue(self) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT
                        COALESCE((
                            SELECT SUM(system_commission_amount)
                            FROM withdrawals
                            WHERE LOWER(status) IN ('approved', 'paid')
                        ), 0),
                        COALESCE((
                            SELECT SUM(amount)
                            FROM subscription_payments
                            WHERE status = 'completed'
                        ), 0),
                        (
                            SELECT COUNT(*)
                            FROM withdrawals
                            WHERE LOWER(status) IN ('approved', 'paid')
                        ),
                        (
                            SELECT COUNT(*)
                            FROM subscription_payments
                            WHERE status = 'completed'
                        ),
                        COALESCE((
                            SELECT SUM(gross_amount)
                            FROM system_cashouts
                            WHERE status IN ('pending', 'completed')
                        ), 0);
                    """
                )
                (
                    commission_revenue, subscription_revenue, commission_count,
                    subscription_count, cashouts_reserved,
                ) = await cursor.fetchone()
                commission_revenue = float(commission_revenue or 0)
                subscription_revenue = float(subscription_revenue or 0)
                cashouts_reserved = float(cashouts_reserved or 0)
                total_revenue = commission_revenue + subscription_revenue
                available_balance = max(0.0, total_revenue - cashouts_reserved)
                await cursor.execute(
                    """
                    SELECT id, gross_amount, fee_amount, net_amount, recipient_number,
                           payout_provider, transaction_reference, status, created_at
                    FROM system_cashouts
                    ORDER BY created_at DESC
                    LIMIT 20;
                    """
                )
                cashouts = await cursor.fetchall()
                return {
                    "currency": "TZS",
                    "withdrawal_commissions": commission_revenue,
                    "subscription_payments": subscription_revenue,
                    "total_recorded_revenue": total_revenue,
                    "cashouts_reserved": cashouts_reserved,
                    "available_balance": available_balance,
                    "successful_withdrawals": commission_count,
                    "successful_subscriptions": subscription_count,
                    "cashouts": [
                        {
                            "id": row[0],
                            "gross_amount": float(row[1]),
                            "fee_amount": float(row[2]),
                            "net_amount": float(row[3]),
                            "recipient_number": row[4],
                            "payout_provider": row[5],
                            "transaction_reference": row[6],
                            "status": row[7],
                            "created_at": row[8].isoformat() if row[8] else None,
                        }
                        for row in cashouts
                    ],
                }
        finally:
            await conn.close()

    async def create_system_cashout(
        self,
        admin_id: int,
        password: str,
        gross_amount: Decimal,
        recipient_number: str,
        payout_provider: str,
    ) -> Dict[str, Any]:
        gross_amount = gross_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if gross_amount <= 0:
            raise HTTPException(status_code=400, detail="Cashout amount must be greater than zero.")

        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT password_hash FROM admins WHERE id = %s;",
                    (admin_id,),
                )
                admin = await cursor.fetchone()
                if not admin:
                    raise HTTPException(status_code=401, detail="Admin authentication required.")
                try:
                    password_valid = checkpw(password.encode("utf-8"), admin[0].encode("utf-8"))
                except (AttributeError, ValueError):
                    password_valid = False
                if not password_valid:
                    raise HTTPException(status_code=401, detail="Invalid admin password.")

                await cursor.execute("SELECT pg_advisory_xact_lock(781204630);")
                await cursor.execute(
                    """
                    SELECT
                        COALESCE((
                            SELECT SUM(system_commission_amount)
                            FROM withdrawals
                            WHERE LOWER(status) IN ('approved', 'paid')
                        ), 0)
                        + COALESCE((
                            SELECT SUM(amount)
                            FROM subscription_payments
                            WHERE status = 'completed'
                        ), 0)
                        - COALESCE((
                            SELECT SUM(gross_amount)
                            FROM system_cashouts
                            WHERE status IN ('pending', 'completed')
                        ), 0);
                    """
                )
                available = Decimal(str((await cursor.fetchone())[0] or 0))
                if gross_amount > available:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cashout exceeds available system earnings ({max(available, Decimal('0')):.2f} TZS).",
                    )

                fee_amount = (gross_amount * Decimal("0.011")).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                net_amount = gross_amount - fee_amount
                external_reference = f"NETKITONGA-WD-{secrets.token_hex(8).upper()}"
                await cursor.execute(
                    """
                    INSERT INTO system_cashouts (
                        admin_id, gross_amount, fee_amount, net_amount,
                        recipient_number, payout_provider, external_reference, status
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
                    RETURNING id;
                    """,
                    (
                        admin_id, gross_amount, fee_amount, net_amount,
                        recipient_number, payout_provider, external_reference,
                    ),
                )
                cashout_id = (await cursor.fetchone())[0]
                await conn.commit()
        except HTTPException:
            raise
        except Exception as error:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Could not reserve system cashout: {error}")
        finally:
            await conn.close()

        disbursement = DisbursementService()
        transaction_reference = external_reference
        outcome_status = "pending"
        message = "System cashout submitted; awaiting AzamPay confirmation."
        try:
            response = await asyncio.to_thread(
                disbursement.send,
                float(net_amount),
                recipient_number,
                payout_provider,
                external_reference,
            )
            transaction_reference = response.get("pgReferenceId") or external_reference
        except DisbursementRejected as error:
            await self._set_system_cashout_status(cashout_id, "failed")
            outcome_status = "failed"
            message = str(error)
        except DisbursementPreflightError as error:
            await self._set_system_cashout_status(cashout_id, "failed")
            outcome_status = "failed"
            message = str(error)
        except HTTPException as error:
            detail = error.detail if isinstance(error.detail, str) else "AzamPay returned an unexpected response."
            message = (
                f"{detail} The cashout remains pending because its payout outcome "
                "could not be confirmed; check AzamPay before retrying."
            )
        except Exception as error:
            message = (
                "Cashout outcome is unconfirmed. The amount remains reserved; "
                f"check AzamPay before retrying. ({type(error).__name__})"
            )
        else:
            await self._set_system_cashout_reference(cashout_id, transaction_reference)

        return {
            "message": message,
            "cashout_id": cashout_id,
            "status": outcome_status,
            "gross_amount": float(gross_amount),
            "fee_amount": float(fee_amount),
            "net_amount": float(net_amount),
            "transaction_reference": transaction_reference,
        }

    async def _set_system_cashout_status(self, cashout_id: int, status: str) -> None:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    UPDATE system_cashouts
                    SET status = %s,
                        completed_at = CASE WHEN %s = 'completed' THEN NOW() ELSE completed_at END
                    WHERE id = %s AND status = 'pending';
                    """,
                    (status, status, cashout_id),
                )
                await conn.commit()
        except Exception:
            await conn.rollback()
            raise
        finally:
            await conn.close()

    async def _set_system_cashout_reference(self, cashout_id: int, reference: str) -> None:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE system_cashouts SET transaction_reference = %s WHERE id = %s;",
                    (reference, cashout_id),
                )
                await conn.commit()
        except Exception:
            await conn.rollback()
            raise
        finally:
            await conn.close()

    async def list_tenants(self) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT id, business_name, system_name, email, status, created_at
                    FROM tenants
                    ORDER BY created_at DESC;
                """)
                rows = await cursor.fetchall()
                cols = [d[0] for d in (cursor.description or [])]
                return [dict(zip(cols, r)) for r in rows]
        finally:
            await conn.close()

    async def list_routers(self) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT r.id, r.tenant_id, t.business_name, r.branch_id, r.router_name,
                           r.driver_type, r.nas_identifier, r.ip_address, r.status, r.last_heartbeat_at
                    FROM routers r
                    LEFT JOIN tenants t ON t.id = r.tenant_id
                    ORDER BY r.id DESC;
                """)
                rows = await cursor.fetchall()
                cols = [d[0] for d in (cursor.description or [])]
                return [dict(zip(cols, r)) for r in rows]
        finally:
            await conn.close()

    async def list_packages(self) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT p.id, p.tenant_id, t.business_name, p.package_name, p.price,
                           p.duration_seconds, p.data_quota_bytes, p.mikrotik_rate_limit,
                           p.wifidog_max_down_bandwidth, p.wifidog_max_up_bandwidth,
                           p.status, p.created_at
                    FROM packages p
                    LEFT JOIN tenants t ON t.id = p.tenant_id
                    ORDER BY p.created_at DESC;
                """)
                rows = await cursor.fetchall()
                cols = [d[0] for d in (cursor.description or [])]
                return [dict(zip(cols, r)) for r in rows]
        finally:
            await conn.close()

    async def list_vouchers(self) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT v.id, v.tenant_id, t.business_name, v.package_id, p.package_name,
                           v.code, v.status, v.expires_at, v.redeemed_at, v.created_at
                    FROM vouchers v
                    LEFT JOIN tenants t ON t.id = v.tenant_id
                    LEFT JOIN packages p ON p.id = v.package_id
                    ORDER BY v.created_at DESC;
                """)
                rows = await cursor.fetchall()
                cols = [d[0] for d in (cursor.description or [])]
                return [dict(zip(cols, r)) for r in rows]
        finally:
            await conn.close()

    async def list_payments(self) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT pay.id, pay.tenant_id, t.business_name, pay.branch_id, pay.router_id,
                           pay.package_id, pay.buyer_id, pay.amount, pay.payment_gateway,
                           pay.gateway_reference, pay.pg_transaction_id, pay.status, pay.auth_token, pay.created_at,
                           b.buyer_mac, b.phone_number
                    FROM payments pay
                    LEFT JOIN tenants t ON t.id = pay.tenant_id
                    LEFT JOIN buyers b ON b.id = pay.buyer_id
                    ORDER BY pay.created_at DESC;
                """)
                rows = await cursor.fetchall()
                cols = [d[0] for d in (cursor.description or [])]
                return [dict(zip(cols, r)) for r in rows]
        finally:
            await conn.close()

    async def list_sessions(self) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT s.id, s.tenant_id, t.business_name, s.router_id, r.router_name,
                           s.buyer_id, b.buyer_mac, s.session_id, s.assigned_ip,
                           s.bytes_uploaded, s.bytes_downloaded, s.start_time,
                           s.expiration_time, s.status
                    FROM active_sessions s
                    LEFT JOIN tenants t ON t.id = s.tenant_id
                    LEFT JOIN routers r ON r.id = s.router_id
                    LEFT JOIN buyers b ON b.id = s.buyer_id
                    ORDER BY s.start_time DESC;
                """)
                rows = await cursor.fetchall()
                cols = [d[0] for d in (cursor.description or [])]
                return [dict(zip(cols, r)) for r in rows]
        finally:
            await conn.close()

    async def update_tenant_status(self, tenant_id: int, status: str) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE tenants SET status = %s WHERE id = %s RETURNING id;",
                    (status, tenant_id),
                )
                updated = await cursor.fetchone()
                if not updated:
                    raise HTTPException(status_code=404, detail="Tenant not found.")
                await conn.commit()
                return {"message": "Tenant updated successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def delete_tenant(self, tenant_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM tenants WHERE id = %s RETURNING id;", (tenant_id,))
                deleted = await cursor.fetchone()
                if not deleted:
                    raise HTTPException(status_code=404, detail="Tenant not found.")
                await conn.commit()
                return {"message": "Tenant deleted successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def update_router_status(self, router_id: int, status: str) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE routers SET status = %s WHERE id = %s RETURNING id;",
                    (status, router_id),
                )
                updated = await cursor.fetchone()
                if not updated:
                    raise HTTPException(status_code=404, detail="Router not found.")
                await conn.commit()
                return {"message": "Router updated successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def delete_router(self, router_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM routers WHERE id = %s RETURNING id;", (router_id,))
                deleted = await cursor.fetchone()
                if not deleted:
                    raise HTTPException(status_code=404, detail="Router not found.")
                await conn.commit()
                return {"message": "Router deleted successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def update_package_status(self, package_id: int, status: str) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE packages SET status = %s WHERE id = %s RETURNING id;",
                    (status, package_id),
                )
                updated = await cursor.fetchone()
                if not updated:
                    raise HTTPException(status_code=404, detail="Package not found.")
                await conn.commit()
                return {"message": "Package updated successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def delete_package(self, package_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM packages WHERE id = %s RETURNING id;", (package_id,))
                deleted = await cursor.fetchone()
                if not deleted:
                    raise HTTPException(status_code=404, detail="Package not found.")
                await conn.commit()
                return {"message": "Package deleted successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def update_voucher_status(self, voucher_id: int, status: str) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE vouchers SET status = %s WHERE id = %s RETURNING id;",
                    (status, voucher_id),
                )
                updated = await cursor.fetchone()
                if not updated:
                    raise HTTPException(status_code=404, detail="Voucher not found.")
                await conn.commit()
                return {"message": "Voucher updated successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def delete_voucher(self, voucher_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("DELETE FROM vouchers WHERE id = %s RETURNING id;", (voucher_id,))
                deleted = await cursor.fetchone()
                if not deleted:
                    raise HTTPException(status_code=404, detail="Voucher not found.")
                await conn.commit()
                return {"message": "Voucher deleted successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def update_payment_status(self, payment_id: int, status: str) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE payments SET status = %s WHERE id = %s RETURNING id;",
                    (status, payment_id),
                )
                updated = await cursor.fetchone()
                if not updated:
                    raise HTTPException(status_code=404, detail="Payment not found.")
                await conn.commit()
                return {"message": "Payment updated successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()

    async def terminate_session(self, session_id: str) -> Dict[str, Any]:
        try:
            terminated = await terminate_active_session(session_id)
        except (OmadaConfigurationError, OmadaControllerError) as exc:
            raise HTTPException(
                status_code=502,
                detail=(
                    "The session was terminated in NetKitonga, but Omada could "
                    f"not disconnect the client: {exc}"
                ),
            ) from exc
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        if not terminated:
            raise HTTPException(status_code=404, detail="Session not found.")
        return {"message": "Session terminated successfully."}
