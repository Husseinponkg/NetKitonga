from bcrypt import hashpw, gensalt, checkpw

from backend.config.db import connection

class AuthController:
    async def register(self, business_name: str, system_name: str, email: str, password: str):
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id FROM tenants WHERE email = %s",
                    (email,)
                )
                existing_user = await cursor.fetchone()

                if existing_user:
                    return {"message": "A tenant with this email already exists"}

                hashed_password = hashpw(password.encode("utf-8"), gensalt()).decode("utf-8")
                await cursor.execute(
                    "INSERT INTO tenants (business_name, system_name, email, password_hash) VALUES (%s, %s, %s, %s)",
                    (business_name, system_name, email, hashed_password)
                )

            await conn.commit()
            return {"message": "User registered successfully"}
        finally:
            await conn.close()

    async def login(self, email: str, password: str):
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "SELECT id, email, password_hash, business_name FROM tenants WHERE email = %s",
                    (email,)
                )
                user = await cursor.fetchone()

                if not user:
                    return {"message": "Invalid email or password"}

                user_id, user_email, stored_hash, business_name = user

                if checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
                    return {
                        "message": "Login successful",
                        "user": {
                            "id": user_id,
                            "email": user_email,
                            "business_name": business_name
                        }
                    }

                return {"message": "Invalid email or password"}
        finally:
            await conn.close()

    async def update(self, email: str, new_business_name: str, new_system_name: str, new_email: str, new_password: str):
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                hashed_password = hashpw(new_password.encode("utf-8"), gensalt()).decode("utf-8")
                await cursor.execute(
                    "UPDATE tenants SET business_name = %s, system_name = %s, email = %s, password_hash = %s WHERE email = %s",
                    (new_business_name, new_system_name, new_email, hashed_password, email)
                )
            await conn.commit()
            return {"message": "User updated successfully"}
        finally:
            await conn.close()

    async def delete(self, id: int):
        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "DELETE FROM tenants WHERE id = %s",
                    (id,)
                )
            await conn.commit()
            return {"message": "User deleted successfully"}
        finally:
            await conn.close()
