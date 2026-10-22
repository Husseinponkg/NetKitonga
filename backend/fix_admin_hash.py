from bcrypt import hashpw, gensalt
import asyncio
import sys

sys.path.insert(0, ".")
from config.db import connection


async def fix_admin():
    email = "obumehussein8@gmail.com"
    plaintext_password = "A002#tz1"

    hashed = hashpw(plaintext_password.encode("utf-8"), gensalt()).decode("utf-8")
    print("Generated hash:", hashed)

    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "UPDATE admins SET password_hash = %s WHERE email = %s RETURNING id, email, LEFT(password_hash, 30) AS hash_prefix;",
                (hashed, email),
            )
            row = await cursor.fetchone()
            if row:
                print("Updated admin:", row)
            else:
                print("No admin found with email:", email)
        await conn.commit()
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(fix_admin())
