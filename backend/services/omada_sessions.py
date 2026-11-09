import asyncio
import logging
from typing import Optional

from config.db import connection
from services.omada import OmadaControllerError, OmadaService

logger = logging.getLogger(__name__)


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


async def expire_due_sessions(batch_size: int = 10) -> int:
    conn = await connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """
                WITH due_sessions AS (
                    SELECT s.session_id
                    FROM active_sessions AS s
                    WHERE (
                        s.status = 'active'
                        AND s.expiration_time <= NOW()
                    ) OR (
                        s.status = 'terminated'
                        AND EXISTS (
                            SELECT 1
                            FROM omada_client_sessions AS context
                            WHERE context.session_id = s.session_id
                        )
                    )
                    ORDER BY s.expiration_time
                    LIMIT %s
                    FOR UPDATE OF s SKIP LOCKED
                )
                UPDATE active_sessions AS s
                SET status = 'terminated'
                FROM due_sessions AS due
                WHERE s.session_id = due.session_id
                RETURNING s.session_id;
                """,
                (batch_size,),
            )
            sessions = await cursor.fetchall()
            await conn.commit()
    except Exception:
        await conn.rollback()
        raise
    finally:
        await conn.close()

    for (session_id,) in sessions:
        try:
            await terminate_session(session_id)
        except OmadaControllerError:
            logger.exception(
                "Could not revoke expired Omada session %s; it will be retried.",
                session_id,
            )
        except Exception:
            logger.exception(
                "Could not process expired session %s; it will be retried.",
                session_id,
            )

    return len(sessions)
