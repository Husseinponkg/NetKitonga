from config.db import connection

class PaymentController:
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
                
                # 3. If verified successful, execute ledger balance updates to fund the tenant wallet account
                if resolved_status == 'completed':
                    wallet_update_query = """
                        UPDATE tenant_wallets 
                        SET total_earned = total_earned + %s, 
                            current_balance = current_balance + %s, 
                            updated_at = NOW() 
                        WHERE tenant_id = %s;
                    """
                    await cursor.execute(wallet_update_query, (amount, amount, tenant_id))
                
                # Commit all structural changes to PostgreSQL together
                await conn.commit()
                return True
                
        except Exception as e:
            await conn.rollback()
            print(f"Callback accounting processing engine error: {str(e)}")
            return False
        finally:
            await conn.close() # Clean async connection slot release
