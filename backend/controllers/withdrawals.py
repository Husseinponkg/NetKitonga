from typing import List, Dict, Any
from fastapi import HTTPException
from config.db import connection
from models.withdrawals import WithdrawalRequest, WithdrawalUpdate, WithdrawalResponse
from services.disbursements import DisbursementRejected, DisbursementService
import secrets

def available_cash_balance(
    mobile_money_earned: float,
    total_withdrawn: float,
    pending_withdrawals: float = 0,
) -> float:
    return round(
        max(
            0.0,
            float(mobile_money_earned or 0)
            - float(total_withdrawn or 0)
            - float(pending_withdrawals or 0),
        ),
        2,
    )


class WithdrawalController:
    async def get_wallet_balance(self, tenant_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT total_withdrawn FROM tenant_wallets WHERE tenant_id = %s;",
                    (tenant_id,)
                )
                wallet = await cursor.fetchone()
                total_withdrawn = float(wallet[0] or 0) if wallet else 0.0
                await cursor.execute(
                    """
                    SELECT COALESCE(SUM(amount), 0)
                    FROM payments
                    WHERE tenant_id = %s
                      AND status = 'completed'
                      AND LOWER(payment_gateway) = 'azampay';
                    """,
                    (tenant_id,),
                )
                mobile_money_earned = float((await cursor.fetchone())[0] or 0)
                await cursor.execute(
                    """
                    SELECT COALESCE(SUM(amount), 0)
                    FROM withdrawals
                    WHERE tenant_id = %s
                      AND LOWER(status) = 'pending';
                    """,
                    (tenant_id,),
                )
                pending_withdrawals = float((await cursor.fetchone())[0] or 0)
                return {
                    "total_earned": mobile_money_earned,
                    "total_withdrawn": total_withdrawn,
                    "current_balance": available_cash_balance(
                        mobile_money_earned, total_withdrawn, pending_withdrawals
                    ),
                }
        finally:
            await conn.close()

    async def request_withdrawal(self, tenant_id: int, data: WithdrawalRequest) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, total_withdrawn FROM tenant_wallets WHERE tenant_id = %s FOR UPDATE;",
                    (tenant_id,)
                )
                wallet = await cursor.fetchone()
                if not wallet:
                    raise HTTPException(status_code=404, detail="Wallet not found for this tenant.")

                wallet_id = wallet[0]
                total_withdrawn = float(wallet[1] or 0)
                await cursor.execute(
                    """
                    SELECT COALESCE(SUM(amount), 0)
                    FROM payments
                    WHERE tenant_id = %s
                      AND status = 'completed'
                      AND LOWER(payment_gateway) = 'azampay';
                    """,
                    (tenant_id,),
                )
                mobile_money_earned = float((await cursor.fetchone())[0] or 0)
                await cursor.execute(
                    """
                    SELECT COALESCE(SUM(amount), 0)
                    FROM withdrawals
                    WHERE tenant_id = %s
                      AND LOWER(status) = 'pending';
                    """,
                    (tenant_id,),
                )
                pending_withdrawals = float((await cursor.fetchone())[0] or 0)
                current_balance = available_cash_balance(
                    mobile_money_earned, total_withdrawn, pending_withdrawals
                )

                if data.amount < 2000:
                    raise HTTPException(status_code=400, detail="Minimum withdrawal amount is 2000 TZS.")
                if data.amount > current_balance:
                    raise HTTPException(status_code=400, detail="Insufficient wallet balance for this withdrawal.")

                external_reference = f"NETKITONGA-WD-{secrets.token_hex(8).upper()}"
                system_commission = round(float(data.amount) * 0.024, 2)
                azampay_fee = round(float(data.amount) * 0.011, 2)
                commission = system_commission + azampay_fee
                transaction_reference = external_reference
                initial_status = "pending"
                try:
                    net_payout = round(float(data.amount) - commission, 2)
                    disbursement = DisbursementService().send(
                        net_payout,
                        data.mobile_money_number,
                        data.payout_provider,
                        external_reference,
                    )
                    transaction_reference = disbursement.get("pgReferenceId") or external_reference
                except DisbursementRejected as disb_error:
                    print(f"Disbursement rejected: {disb_error}")
                    initial_status = "rejected"
                except Exception as disb_error:
                    print(f"Disbursement outcome is unconfirmed: {disb_error}")

                await cursor.execute(
                    """
                    INSERT INTO withdrawals (
                        tenant_id, wallet_id, amount, commission, system_commission_amount,
                        azampay_fee_amount, mobile_money_number, payout_provider, status,
                        transaction_reference
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id;
                    """,
                    (
                        tenant_id, wallet_id, data.amount, commission, system_commission,
                        azampay_fee, data.mobile_money_number, data.payout_provider,
                        initial_status, transaction_reference,
                    )
                )
                new_id = (await cursor.fetchone())[0]

                await conn.commit()
                return {
                    "message": (
                        "AzamPay rejected the payout."
                        if initial_status == "rejected"
                        else "Withdrawal request submitted; awaiting AzamPay confirmation."
                    ),
                    "withdrawal_id": new_id,
                    "status": initial_status,
                }
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Withdrawal request failed: {str(e)}")
        finally:
            await conn.close()

    async def get_all_withdrawals(self) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT w.id, w.tenant_id, t.business_name, w.wallet_id, w.amount, w.commission, w.mobile_money_number,
                           w.payout_provider, w.transaction_reference, w.status, w.created_at
                    FROM withdrawals w
                    LEFT JOIN tenants t ON t.id = w.tenant_id
                    ORDER BY w.created_at DESC;
                    """
                )
                rows = await cursor.fetchall()
                result = []
                for row in rows:
                    result.append({
                        "id": row[0], "tenant_id": row[1], "business_name": row[2],
                        "wallet_id": row[3], "amount": float(row[4]), "commission": float(row[5] or 0), "mobile_money_number": row[6],
                        "payout_provider": row[7], "transaction_reference": row[8],
                        "status": row[9], "created_at": row[10],
                    })
                return result
        finally:
            await conn.close()

    async def get_tenant_withdrawals(self, tenant_id: int) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, tenant_id, wallet_id, amount, commission, mobile_money_number, payout_provider, transaction_reference, status, created_at FROM withdrawals WHERE tenant_id = %s ORDER BY created_at DESC;",
                    (tenant_id,)
                )
                rows = await cursor.fetchall()
                result = []
                for row in rows:
                    result.append({
                        "id": row[0], "tenant_id": row[1], "wallet_id": row[2],
                        "amount": float(row[3]), "commission": float(row[4] or 0), "mobile_money_number": row[5],
                        "payout_provider": row[6], "transaction_reference": row[7],
                        "status": row[8], "created_at": row[9]
                    })
                return result
        finally:
            await conn.close()

    async def update_withdrawal_status(self, data: WithdrawalUpdate) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, wallet_id, amount, status FROM withdrawals WHERE id = %s FOR UPDATE;",
                    (data.withdrawal_id,),
                )
                row = await cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Withdrawal record not found.")

                withdrawal_id, wallet_id, amount, current_status = row
                amount = float(amount or 0)

                if str(data.status).lower() in ("approved", "paid") and current_status not in ("approved", "paid"):
                    await cursor.execute(
                        "UPDATE tenant_wallets SET total_withdrawn = total_withdrawn + %s, current_balance = current_balance - %s WHERE id = %s;",
                        (amount, amount, wallet_id),
                    )

                if str(data.status).lower() == "rejected" and current_status in ("approved", "paid"):
                    await cursor.execute(
                        "UPDATE tenant_wallets SET total_withdrawn = total_withdrawn - %s, current_balance = current_balance + %s WHERE id = %s;",
                        (amount, amount, wallet_id),
                    )

                await cursor.execute(
                    "UPDATE withdrawals SET status = %s, transaction_reference = COALESCE(%s, transaction_reference) WHERE id = %s RETURNING id;",
                    (data.status, data.transaction_reference, data.withdrawal_id),
                )
                updated = await cursor.fetchone()
                if not updated:
                    raise HTTPException(status_code=404, detail="Withdrawal record not found.")
                await conn.commit()
                return {"message": f"Withdrawal {data.status} successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")
        finally:
            await conn.close()

    async def process_disbursement_callback(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        reference = payload.get("pgReferenceId") or payload.get("initiatorReferenceId")
        callback_status = str(payload.get("status", "")).strip().lower()
        if not reference:
            raise HTTPException(status_code=400, detail="Missing disbursement reference.")

        if callback_status in {"success", "successful", "completed", "approved"}:
            resolved_status = "approved"
        elif callback_status in {"failure", "failed", "unsuccessful", "rejected"}:
            resolved_status = "rejected"
        else:
            raise HTTPException(status_code=400, detail="Unrecognized disbursement status.")

        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, wallet_id, amount, status FROM withdrawals WHERE transaction_reference = %s FOR UPDATE;",
                    (reference,),
                )
                withdrawal = await cursor.fetchone()
                if not withdrawal:
                    await cursor.execute(
                        """
                        SELECT id, status
                        FROM system_cashouts
                        WHERE transaction_reference = %s OR external_reference = %s
                        FOR UPDATE;
                        """,
                        (reference, reference),
                    )
                    cashout = await cursor.fetchone()
                    if not cashout:
                        raise HTTPException(status_code=404, detail="Withdrawal reference not found.")
                    cashout_id, cashout_status = cashout
                    cashout_status = str(cashout_status).lower()
                    cashout_resolved_status = (
                        "completed" if resolved_status == "approved" else "failed"
                    )
                    if cashout_status == "pending":
                        await cursor.execute(
                            "UPDATE system_cashouts SET status = %s, completed_at = CASE WHEN %s = 'completed' THEN NOW() ELSE completed_at END WHERE id = %s;",
                            (cashout_resolved_status, cashout_resolved_status, cashout_id),
                        )
                    await conn.commit()
                    return {
                        "status": "acknowledged",
                        "withdrawal_status": (
                            cashout_resolved_status if cashout_status == "pending" else cashout_status
                        ),
                    }

                withdrawal_id, wallet_id, amount, current_status = withdrawal
                current_status = str(current_status).lower()
                final_status = current_status

                if current_status == "pending":
                    await cursor.execute(
                        "UPDATE withdrawals SET status = %s WHERE id = %s;",
                        (resolved_status, withdrawal_id),
                    )
                    final_status = resolved_status
                    if resolved_status == "approved":
                        await cursor.execute(
                            "UPDATE tenant_wallets SET total_withdrawn = total_withdrawn + %s, current_balance = current_balance - %s WHERE id = %s;",
                            (amount, amount, wallet_id),
                        )
                elif current_status in {"approved", "paid"} and resolved_status == "rejected":
                    # Older releases approved on API acceptance and deducted early.
                    # Reverse that deduction if the final AzamPay callback failed.
                    await cursor.execute(
                        "UPDATE withdrawals SET status = 'rejected' WHERE id = %s;",
                        (withdrawal_id,),
                    )
                    await cursor.execute(
                        "UPDATE tenant_wallets SET total_withdrawn = total_withdrawn - %s, current_balance = current_balance + %s WHERE id = %s;",
                        (amount, amount, wallet_id),
                    )
                    final_status = "rejected"

                await conn.commit()
                return {
                    "status": "acknowledged",
                    "withdrawal_status": final_status,
                }
        except HTTPException:
            raise
        except Exception as error:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Disbursement callback failed: {error}")
        finally:
            await conn.close()
