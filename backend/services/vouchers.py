import secrets
import string
from typing import List

from config.db import connection
from models.vouchers import VoucherCreate


class VoucherService:
    @staticmethod
    def _generate_code() -> str:
        alphabet = string.ascii_uppercase + string.digits
        value = "".join(secrets.choice(alphabet) for _ in range(12))
        return f"{value[:4]}-{value[4:8]}-{value[8:]}"

    async def create_vouchers(self, tenant_id: int, data: VoucherCreate) -> List[dict]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT id, package_name
                    FROM packages
                    WHERE id = %s AND tenant_id = %s AND status = 'active'
                    """,
                    (data.package_id, tenant_id),
                )
                package = await cursor.fetchone()
                if not package:
                    raise ValueError("Active package was not found for this tenant.")

                created = []
                for _ in range(data.quantity):
                    code = self._generate_code()
                    await cursor.execute(
                        """
                        INSERT INTO vouchers (tenant_id, package_id, code, expires_at)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id, tenant_id, package_id, code, status,
                                  expires_at, redeemed_at, created_at
                        """,
                        (tenant_id, data.package_id, code, data.expires_at),
                    )
                    row = await cursor.fetchone()
                    created.append({
                        "id": row[0],
                        "tenant_id": row[1],
                        "package_id": row[2],
                        "package_name": package[1],
                        "code": row[3],
                        "status": row[4],
                        "expires_at": row[5],
                        "redeemed_at": row[6],
                        "created_at": row[7],
                    })

                await conn.commit()
                return created
        except Exception:
            await conn.rollback()
            raise
        finally:
            await conn.close()

    async def list_vouchers(self, tenant_id: int) -> List[dict]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT v.id, v.tenant_id, v.package_id, p.package_name,
                           v.code, v.status, v.expires_at, v.redeemed_at, v.created_at
                    FROM vouchers v
                    JOIN packages p ON p.id = v.package_id AND p.tenant_id = v.tenant_id
                    WHERE v.tenant_id = %s
                    ORDER BY v.created_at DESC
                    """,
                    (tenant_id,),
                )
                rows = await cursor.fetchall()
                return [
                    {
                        "id": row[0],
                        "tenant_id": row[1],
                        "package_id": row[2],
                        "package_name": row[3],
                        "code": row[4],
                        "status": row[5],
                        "expires_at": row[6],
                        "redeemed_at": row[7],
                        "created_at": row[8],
                    }
                    for row in rows
                ]
        finally:
            await conn.close()