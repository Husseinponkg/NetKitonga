from typing import List, Dict, Any
from fastapi import HTTPException
from config.db import connection
from models.withdrawals import WithdrawalRequest, WithdrawalUpdate, WithdrawalResponse
from services.disbursements import DisbursementService
import secrets

class WithdrawalController:
    async def get_wallet_balance(self, tenant_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT total_earned, total_withdrawn, current_balance FROM tenant_wallets WHERE tenant_id = %s;",
                    (tenant_id,)
                )
                wallet = await cursor.fetchone()
                if not wallet:
                    return {"total_earned": 0.0, "total_withdrawn": 0.0, "current_balance": 0.0}
                return {
                    "total_earned": float(wallet[0] or 0),
                    "total_withdrawn": float(wallet[1] or 0),
                    "current_balance": float(wallet[2] or 0)
                }
        finally:
            await conn.close()

    async def request_withdrawal(self, tenant_id: int, data: WithdrawalRequest) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, current_balance FROM tenant_wallets WHERE tenant_id = %s;",
                    (tenant_id,)
                )
                wallet = await cursor.fetchone()
                if not wallet:
                    raise HTTPException(status_code=404, detail="Wallet not found for this tenant.")

                wallet_id = wallet[0]
                current_balance = float(wallet[1] or 0)

                if data.amount > current_balance:
                    raise HTTPException(status_code=400, detail="Insufficient wallet balance for this withdrawal.")

                external_reference = f"NETKITONGA-WD-{secrets.token_hex(8).upper()}"
                disbursement = DisbursementService().send(
                    data.amount,
                    data.mobile_money_number,
                    data.payout_provider,
                    external_reference,
                )
                transaction_reference = disbursement.get("pgReferenceId") or external_reference
                await cursor.execute(
                    """
                    INSERT INTO withdrawals (tenant_id, wallet_id, amount, mobile_money_number, payout_provider, status)
                    VALUES (%s, %s, %s, %s, %s, 'pending')
                    RETURNING id;
                    """,
                    (tenant_id, wallet_id, data.amount, data.mobile_money_number, data.payout_provider)
                )
                new_id = (await cursor.fetchone())[0]
                await cursor.execute(
                    "UPDATE withdrawals SET transaction_reference = %s WHERE id = %s;",
                    (transaction_reference, new_id),
                )

                await cursor.execute(
                    "UPDATE tenant_wallets SET total_withdrawn = total_withdrawn + %s, current_balance = current_balance - %s WHERE id = %s;",
                    (data.amount, data.amount, wallet_id)
                )
                await conn.commit()
                return {"message": "Withdrawal request submitted successfully.", "withdrawal_id": new_id}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Withdrawal request failed: {str(e)}")
        finally:
            await conn.close()

    async def get_tenant_withdrawals(self, tenant_id: int) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, tenant_id, wallet_id, amount, mobile_money_number, payout_provider, transaction_reference, status, created_at FROM withdrawals WHERE tenant_id = %s ORDER BY created_at DESC;",
                    (tenant_id,)
                )
                rows = await cursor.fetchall()
                result = []
                for row in rows:
                    result.append({
                        "id": row[0], "tenant_id": row[1], "wallet_id": row[2],
                        "amount": float(row[3]), "mobile_money_number": row[4],
                        "payout_provider": row[5], "transaction_reference": row[6],
                        "status": row[7], "created_at": row[8]
                    })
                return result
        finally:
            await conn.close()

    async def update_withdrawal_status(self, data: WithdrawalUpdate) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE withdrawals SET status = %s, transaction_reference = %s WHERE id = %s RETURNING id;",
                    (data.status, data.transaction_reference, data.withdrawal_id)
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
        callback_status = str(payload.get("status", "")).lower()
        if not reference:
            raise HTTPException(status_code=400, detail="Missing disbursement reference.")

        status = "approved" if callback_status in {"success", "successful", "completed", "approved"} else "rejected"
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, wallet_id, amount, status FROM withdrawals WHERE transaction_reference = %s FOR UPDATE;",
                    (reference,),
                )
                withdrawal = await cursor.fetchone()
                if not withdrawal:
                    raise HTTPException(status_code=404, detail="Withdrawal reference not found.")

                if withdrawal[3] == "pending":
                    await cursor.execute(
                        "UPDATE withdrawals SET status = %s WHERE id = %s;",
                        (status, withdrawal[0]),
                    )
                    if status == "rejected":
                        await cursor.execute(
                            "UPDATE tenant_wallets SET total_withdrawn = total_withdrawn - %s, current_balance = current_balance + %s WHERE id = %s;",
                            (withdrawal[2], withdrawal[2], withdrawal[1]),
                        )
                await conn.commit()
                return {"status": "acknowledged", "withdrawal_status": status}
        except HTTPException:
            raise
        except Exception as error:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Disbursement callback failed: {error}")
        finally:
            await conn.close()
