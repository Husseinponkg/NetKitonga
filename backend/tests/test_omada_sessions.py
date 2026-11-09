import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.omada import OmadaControllerError
from services.omada_sessions import terminate_session


def make_connection(cursor):
    cursor_context = MagicMock()
    cursor_context.__aenter__ = AsyncMock(return_value=cursor)
    cursor_context.__aexit__ = AsyncMock(return_value=False)

    conn = MagicMock()
    conn.cursor.return_value = cursor_context
    conn.commit = AsyncMock()
    conn.rollback = AsyncMock()
    conn.close = AsyncMock()
    return conn


class OmadaSessionTerminationTests(unittest.IsolatedAsyncioTestCase):
    async def test_terminating_session_disconnects_and_clears_omada_context(self):
        cursor = AsyncMock()
        cursor.fetchone.side_effect = [
            ("session-123",),
            ("AA:BB:CC:DD:EE:FF", "Rchuganet", "Guest WiFi"),
        ]
        conn = make_connection(cursor)

        with (
            patch(
                "services.omada_sessions.connection",
                new=AsyncMock(side_effect=[conn, conn]),
            ),
            patch(
                "services.omada_sessions.asyncio.to_thread",
                new=AsyncMock(return_value=None),
            ) as to_thread,
        ):
            result = await terminate_session("session-123", tenant_id=7)

        self.assertTrue(result)
        first_query, first_params = cursor.execute.await_args_list[0].args
        self.assertIn("tenant_id = %s", first_query)
        self.assertEqual(first_params, (7, "session-123"))
        self.assertEqual(
            to_thread.await_args.args[1:],
            ("AA:BB:CC:DD:EE:FF", "Rchuganet", "Guest WiFi"),
        )
        self.assertIn(
            "DELETE FROM omada_client_sessions",
            cursor.execute.await_args_list[2].args[0],
        )
        self.assertEqual(conn.close.await_count, 2)

    async def test_failed_omada_disconnect_preserves_context_for_retry(self):
        cursor = AsyncMock()
        cursor.fetchone.side_effect = [
            ("session-123",),
            ("AA:BB:CC:DD:EE:FF", "Rchuganet", "Guest WiFi"),
        ]
        conn = make_connection(cursor)
        disconnect_error = OmadaControllerError("Controller unavailable")

        with (
            patch(
                "services.omada_sessions.connection",
                new=AsyncMock(return_value=conn),
            ),
            patch(
                "services.omada_sessions.asyncio.to_thread",
                new=AsyncMock(side_effect=disconnect_error),
            ),
        ):
            with self.assertRaises(OmadaControllerError):
                await terminate_session("session-123")

        self.assertEqual(cursor.execute.await_count, 2)
        conn.close.assert_awaited_once()

    async def test_missing_legacy_context_reports_manual_revocation_requirement(self):
        cursor = AsyncMock()
        cursor.fetchone.side_effect = [
            ("session-123", 15),
            None,
            ("tplink_radius",),
        ]
        conn = make_connection(cursor)

        with (
            patch(
                "services.omada_sessions.connection",
                new=AsyncMock(return_value=conn),
            ),
            patch(
                "services.omada_sessions.asyncio.to_thread",
                new=AsyncMock(),
            ) as to_thread,
        ):
            with self.assertRaisesRegex(
                OmadaControllerError, "Disconnect the client from Omada"
            ):
                await terminate_session("session-123")

        to_thread.assert_not_awaited()
        conn.commit.assert_awaited_once()
        self.assertIn(
            "SELECT driver_type FROM routers",
            cursor.execute.await_args_list[2].args[0],
        )


if __name__ == "__main__":
    unittest.main()
