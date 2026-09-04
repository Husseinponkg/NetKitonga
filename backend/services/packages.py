from typing import List
from config.db import connection
from models.packages import PackageRegister, PackageUpdate, PackageDelete

class PackageService:
    async def create_package(self, tenant_id: int, data: PackageRegister) -> bool:
        """Saves a tenant's brand-new pricing configuration into the postgres database catalogue."""
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = """
                    INSERT INTO packages (
                        tenant_id, package_name, description, price, 
                        duration_seconds, data_quota_bytes, mikrotik_rate_limit, 
                        wifidog_max_down_bandwidth, wifidog_max_up_bandwidth, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """
                params = (
                    tenant_id, data.package_name, data.description, data.price,
                    data.duration_seconds, data.data_quota_bytes, data.mikrotik_rate_limit,
                    data.wifidog_max_down_bandwidth, data.wifidog_max_up_bandwidth,
                    data.status
                )
                await cursor.execute(query, params)
                await conn.commit()
                return True
        except Exception as e:
            await conn.rollback()
            raise RuntimeError(f"Database catalogue append failed: {str(e)}")
        finally:
            await conn.close()

    async def get_all_tenant_packages(self, tenant_id: int) -> List[dict]:
        """Fetches the complete product catalog array belonging to a specific tenant ID account."""
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = """
                    SELECT id, tenant_id, package_name, description, price, 
                           duration_seconds, data_quota_bytes, mikrotik_rate_limit,
                           wifidog_max_down_bandwidth, wifidog_max_up_bandwidth, status, created_at
                    FROM packages WHERE tenant_id = %s ORDER BY price ASC;
                """
                await cursor.execute(query, (tenant_id,))
                rows = await cursor.fetchall()
                
                catalog = []
                for row in rows:
                    catalog.append({
                        "id": row[0], "tenant_id": row[1], "package_name": row[2],
                        "description": row[3], "price": float(row[4]), "duration_seconds": row[5],
                        "data_quota_bytes": row[6], "mikrotik_rate_limit": row[7],
                        "wifidog_max_down_bandwidth": row[8], "wifidog_max_up_bandwidth": row[9],
                        "status": row[10], "created_at": row[11]
                    })
                return catalog
        finally:
            await conn.close()

    async def update_package(self, tenant_id: int, data: PackageUpdate) -> bool:
        """Modifies operational configuration values for a package, keeping unedited inputs intact."""
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = """
                    UPDATE packages SET 
                        package_name = COALESCE(%s, package_name),
                        description = COALESCE(%s, description),
                        price = COALESCE(%s, price),
                        duration_seconds = COALESCE(%s, duration_seconds),
                        data_quota_bytes = COALESCE(%s, data_quota_bytes),
                        mikrotik_rate_limit = COALESCE(%s, mikrotik_rate_limit),
                        wifidog_max_down_bandwidth = COALESCE(%s, wifidog_max_down_bandwidth),
                        wifidog_max_up_bandwidth = COALESCE(%s, wifidog_max_up_bandwidth),
                        status = COALESCE(%s, status)
                    WHERE id = %s AND tenant_id = %s RETURNING id;
                """
                params = (
                    data.package_name, data.description, data.price, data.duration_seconds,
                    data.data_quota_bytes, data.mikrotik_rate_limit, data.wifidog_max_down_bandwidth,
                    data.wifidog_max_up_bandwidth, data.status, data.package_id, tenant_id
                )
                await cursor.execute(query, params)
                updated_row = await cursor.fetchone()
                if not updated_row:
                    return False
                await conn.commit()
                return True
        except Exception as e:
            await conn.rollback()
            raise RuntimeError(f"Database row modification failed: {str(e)}")
        finally:
            await conn.close()

    async def delete_package(self, tenant_id: int, data: PackageDelete) -> bool:
        """Purges a package out of PostgreSQL, locked down securely by the tenant context ID."""
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                query = "DELETE FROM packages WHERE id = %s AND tenant_id = %s RETURNING id;"
                await cursor.execute(query, (data.package_id, tenant_id))
                deleted_row = await cursor.fetchone()
                if not deleted_row:
                    return False
                await conn.commit()
                return True
        finally:
            await conn.close()
