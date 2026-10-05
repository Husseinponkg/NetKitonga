from config.db import connection
from psycopg.rows import dict_row
from psycopg.errors import ForeignKeyViolation, UniqueViolation, NotNullViolation
from fastapi import HTTPException
from typing import Dict, Any
import secrets
import string


class BranchController:
    async def create_branch(self, tenant_id: int, branch_name: str, branch_location: str, branch_email: str, branch_phone: str, branch_manager: str):
        if tenant_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid tenant ID. Please log in again.")

        required_fields = {
            "branch name": branch_name,
            "branch location": branch_location,
            "branch email": branch_email,
            "branch phone": branch_phone,
        }
        missing_field = next((name for name, value in required_fields.items() if not value or not value.strip()), None)
        if missing_field:
            raise HTTPException(status_code=400, detail=f"{missing_field.capitalize()} is required.")

        router_username = f"{branch_name.strip().lower().replace(' ', '-')}-router"
        router_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

        conn = await connection()
        try:
            async with conn.cursor(row_factory=dict_row) as cursor:
                try:
                    await cursor.execute(
                        "INSERT INTO branches (tenant_id, branch_name, branch_location, branch_email, branch_phone, branch_manager, router_username, router_password) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                        (tenant_id, branch_name.strip(), branch_location.strip(), branch_email.strip(), branch_phone.strip(), branch_manager.strip() if branch_manager else None, router_username, router_password)
                    )
                except ForeignKeyViolation:
                    raise HTTPException(status_code=400, detail="The logged-in tenant does not exist. Please log in again.")
                except UniqueViolation:
                    raise HTTPException(status_code=409, detail="A branch with this email already exists.")
                except NotNullViolation:
                    raise HTTPException(status_code=400, detail="Please complete all required branch fields.")
            await conn.commit()
            return {"message": "Branch created successfully", "router_username": router_username, "router_password": router_password}
        except HTTPException:
            await conn.rollback()
            raise
        finally:
            await conn.close()

    async def update_branch(self, tenant_id: int, branch_id: int, branch_name: str, branch_location: str, branch_email: str, branch_phone: str, branch_manager: str):
        conn = await connection()
        try:
            async with conn.cursor(row_factory=dict_row) as cursor:
                await cursor.execute(
                    "UPDATE branches SET branch_name = %s, branch_location = %s, branch_email = %s, branch_phone = %s, branch_manager = %s WHERE id = %s AND tenant_id = %s",
                    (branch_name, branch_location, branch_email, branch_phone, branch_manager, branch_id, tenant_id)
                )
                if cursor.rowcount == 0:
                    return {"message": "Branch not found for this tenant"}
            await conn.commit()
            return {"message": "Branch updated successfully"}
        finally:
            await conn.close()

    async def delete_branch(self, tenant_id: int, branch_id: int):
        conn = await connection()
        try:
            async with conn.cursor(row_factory=dict_row) as cursor:
                await cursor.execute(
                    "DELETE FROM branches WHERE id = %s AND tenant_id = %s",
                    (branch_id, tenant_id)
                )
                if cursor.rowcount == 0:
                    return {"message": "Branch not found for this tenant"}
            await conn.commit()
            return {"message": "Branch deleted successfully"}
        finally:
            await conn.close()

    async def getall_branches(self, tenant_id: int):
        conn = await connection()
        try:
            async with conn.cursor(row_factory=dict_row) as cursor:
                await cursor.execute(
                    "SELECT id, branch_name, COALESCE(branch_location, '') AS branch_location, COALESCE(branch_email, '') AS branch_email, COALESCE(branch_phone, '') AS branch_phone, COALESCE(branch_manager, '') AS branch_manager, COALESCE(router_username, '') AS router_username, COALESCE(router_password, '') AS router_password FROM branches WHERE tenant_id = %s ORDER BY id",
                    (tenant_id,)
                )
                branches = await cursor.fetchall()
                return {"branches": branches}
        finally:
            await conn.close()

    async def get_branch(self, tenant_id: int, branch_id: int):
        conn = await connection()
        try:
            async with conn.cursor(row_factory=dict_row) as cursor:
                await cursor.execute(
                    "SELECT id, branch_name, COALESCE(branch_location, '') AS branch_location, COALESCE(branch_email, '') AS branch_email, COALESCE(branch_phone, '') AS branch_phone, COALESCE(branch_manager, '') AS branch_manager, COALESCE(router_username, '') AS router_username, COALESCE(router_password, '') AS router_password FROM branches WHERE tenant_id = %s AND id = %s",
                    (tenant_id, branch_id)
                )
                branch = await cursor.fetchone()
                if branch:
                    return {"branch": dict(branch)}
                return {"message": "Branch not found for this tenant"}
        finally:
            await conn.close()

    async def get_branch_earnings(self, tenant_id: int) -> Dict[str, Any]:
        conn = await connection()
        try:
            async with conn.cursor(row_factory=dict_row) as cursor:
                await cursor.execute("""
                    SELECT 
                        b.id AS branch_id,
                        b.branch_name,
                        COALESCE(SUM(p.amount), 0) AS total_earned,
                        COUNT(p.id) AS total_transactions,
                        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) AS completed_total,
                        COUNT(p.id) FILTER (WHERE p.status = 'completed') AS completed_transactions
                    FROM branches b
                    LEFT JOIN payments p ON p.branch_id = b.id AND p.tenant_id = b.tenant_id
                    WHERE b.tenant_id = %s
                    GROUP BY b.id, b.branch_name
                    ORDER BY total_earned DESC;
                """, (tenant_id,))
                rows = await cursor.fetchall()
                return {"branches": [dict(r) for r in rows]}
        finally:
            await conn.close()
