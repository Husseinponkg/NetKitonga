import asyncio
from typing import Optional

from config.db import connection
from services.omada import OmadaControllerError, OmadaService


async def terminate_session(
    session_id: str,
    tenant_id: Optional[int] = None,
) -> bool:
    conn = await connection()
    context = None
    driver_type = None
    try:
        async with conn.cursor() as cursor:
            if tenant_id is None:
                await cursor.execute(
                    """
                    UPDATE active_sessions
                    SET status = 'terminated'
                    WHERE session_id = %s AND status IN ('active', 'terminated')
                    RETURNING session_id, router_id;
                    """,
                    (session_id,),
                )
            else:
                await cursor.execute(
                    """
                    UPDATE active_sessions
                    SET status = 'terminated'
                    WHERE tenant_id = %s
                      AND session_id = %s
                      AND status IN ('active', 'terminated')
                    RETURNING session_id, router_id;
                    """,
                    (tenant_id, session_id),
                )

            terminated_session = await cursor.fetchone()
            if not terminated_session:
                return False

            await cursor.execute(
                """
                SELECT client_mac, site, ssid_name
                FROM omada_client_sessions
                WHERE session_id = %s;
                """,
                (session_id,),
            )
            context = await cursor.fetchone()
            if not context:
                await cursor.execute(
                    "SELECT driver_type FROM routers WHERE id = %s;",
                    (terminated_session[1],),
                )
                router = await cursor.fetchone()
                driver_type = router[0] if router else None
            await conn.commit()
    except Exception:
        await conn.rollback()
        raise
    finally:
        await conn.close()

    if not context and driver_type == "tplink_radius":
        raise OmadaControllerError(
            "The TP-Link session has no saved Omada client context. "
            "Disconnect the client from Omada Hotspot Manager manually."
        )

    if context:
        await asyncio.to_thread(
            OmadaService().deauthorize_client,
            context[0],
            context[1],
            context[2],
        )

        conn = await connection()
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "DELETE FROM omada_client_sessions WHERE session_id = %s;",
                    (session_id,),
                )
                await conn.commit()
        except Exception:
            await conn.rollback()
            raise
        finally:
            await conn.close()

    return True
