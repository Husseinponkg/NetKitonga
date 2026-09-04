from typing import List, Dict, Any
from fastapi import HTTPException
from config.db import connection
from models.customers import DeleteCustomer

class CustomerService:
    async def get_all_tenant_buyers(self, tenant_id: int) -> List[Dict[str, Any]]:
        """
        Fetches all network customers discovered at the captive portals,
        safely isolated to return only those belonging to the active tenant.
        """
        conn = await connection()
        try:
            query = "SELECT id, tenant_id, buyer_mac, phone_number, created_at FROM buyers WHERE tenant_id = %s ORDER BY created_at DESC;"
            async with conn.cursor() as cursor:
                await cursor.execute(query, (tenant_id,))
                rows = await cursor.fetchall()
                
                buyers_list = []
                for row in rows:
                    buyers_list.append({
                        "id": row[0],
                        "tenant_id": row[1],
                        "buyer_mac": row[2],
                        "phone_number": row[3],
                        "created_at": row[4]
                    })
                return buyers_list
        finally:
            await conn.close() # Clean connection release back to pool

    async def delete_buyer_record(self, payload: DeleteCustomer) -> bool:
        """
        Purges a captive portal customer device profile out of PostgreSQL storage layers.
        Enforces tenant_id lookup matching to prevent cross-tenant parameter deletions.
        """
        conn = await connection()
        try:
            query = "DELETE FROM buyers WHERE id = %s AND tenant_id = %s RETURNING id;"
            async with conn.cursor() as cursor:
                await cursor.execute(query, (payload.id, payload.tenant_id))
                deleted_row = await cursor.fetchone()
                
                if not deleted_row:
                    return False
                
                await conn.commit()
                return True
        except Exception as e:
            await conn.rollback()
            raise RuntimeError(f"Database deletion failure context: {str(e)}")
        finally:
            await conn.close()
