from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from bcrypt import hashpw, gensalt, checkpw
from config.db import connection


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

    async def list_tenants(self) -> List[Dict[str, Any]]:
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute("""
                    SELECT id, business_name, system_name, email, created_at
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
                           pay.gateway_reference, pay.status, pay.auth_token, pay.created_at,
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
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE active_sessions SET status = 'terminated' WHERE session_id = %s RETURNING session_id;",
                    (session_id,),
                )
                terminated = await cursor.fetchone()
                if not terminated:
                    raise HTTPException(status_code=404, detail="Session not found.")
                await conn.commit()
                return {"message": "Session terminated successfully."}
        except HTTPException:
            raise
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            await conn.close()
