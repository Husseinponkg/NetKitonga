from typing import Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from config.db import connection

settings_endpoints = APIRouter(prefix="/settings", tags=["settings"])

class SettingsResponse(BaseModel):
    id: int
    business_name: str
    system_name: str
    email: EmailStr

class SettingsUpdate(BaseModel):
    tenant_id: int
    business_name: str
    system_name: str
    email: EmailStr
    password: str | None = None

@settings_endpoints.get("", response_model=SettingsResponse)
async def get_settings(tenant_id: int):
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT id, business_name, system_name, email FROM tenants WHERE id = %s", (tenant_id,))
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Tenant settings not found.")
            return dict(zip(("id", "business_name", "system_name", "email"), row))
    finally:
        await conn.close()

@settings_endpoints.put("", response_model=Dict[str, str])
async def update_settings(payload: SettingsUpdate):
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            if payload.password:
                from bcrypt import gensalt, hashpw
                password_hash = hashpw(payload.password.encode(), gensalt()).decode()
                query = "UPDATE tenants SET business_name = %s, system_name = %s, email = %s, password_hash = %s WHERE id = %s"
                params = (payload.business_name, payload.system_name, payload.email, password_hash, payload.tenant_id)
            else:
                query = "UPDATE tenants SET business_name = %s, system_name = %s, email = %s WHERE id = %s"
                params = (payload.business_name, payload.system_name, payload.email, payload.tenant_id)
            await cursor.execute(query, params)
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Tenant settings not found.")
            await conn.commit()
            return {"message": "Settings updated successfully."}
    except Exception:
        await conn.rollback()
        raise
    finally:
        await conn.close()
