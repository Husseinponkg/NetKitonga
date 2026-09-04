from config.db import connection
from psycopg.rows import dict_row
from psycopg.errors import ForeignKeyViolation, UniqueViolation, NotNullViolation
from fastapi import HTTPException


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

        conn = await connection()
        try:
            async with conn.cursor(row_factory=dict_row) as cursor:
                try:
                    await cursor.execute(
                        "INSERT INTO branches (tenant_id, branch_name, branch_location, branch_email, branch_phone, branch_manager) VALUES (%s, %s, %s, %s, %s, %s)",
                        (tenant_id, branch_name.strip(), branch_location.strip(), branch_email.strip(), branch_phone.strip(), branch_manager.strip() if branch_manager else None)
                    )
                except ForeignKeyViolation:
                    raise HTTPException(status_code=400, detail="The logged-in tenant does not exist. Please log in again.")
                except UniqueViolation:
                    raise HTTPException(status_code=409, detail="A branch with this email already exists.")
                except NotNullViolation:
                    raise HTTPException(status_code=400, detail="Please complete all required branch fields.")
            await conn.commit()
            return {"message": "Branch created successfully"}
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
                    "SELECT id, branch_name, branch_location, branch_email, branch_phone, branch_manager FROM branches WHERE tenant_id = %s ORDER BY id",
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
                    "SELECT id, branch_name, branch_location, branch_email, branch_phone, branch_manager FROM branches WHERE tenant_id = %s AND id = %s",
                    (tenant_id, branch_id)
                )
                branch = await cursor.fetchone()
                if branch:
                    return {"branch": dict(branch)}
                return {"message": "Branch not found for this tenant"}
        finally:
            await conn.close()
