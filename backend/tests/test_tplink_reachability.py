import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.tplink import TplinkController


def make_connection(cursor):
    cursor_context = MagicMock()
    cursor_context.__aenter__ = AsyncMock(return_value=cursor)
    cursor_context.__aexit__ = AsyncMock(return_value=False)

    conn = MagicMock()
    conn.cursor.return_value = cursor_context
    conn.close = AsyncMock()
    conn.commit = AsyncMock()
    conn.rollback = AsyncMock()
    return conn


class TplinkReachabilityTests(unittest.IsolatedAsyncioTestCase):
    async def test_marks_registered_ap_online_after_successful_ping(self):
        last_heartbeat = datetime(2026, 1, 1, tzinfo=timezone.utc)
        cursor = AsyncMock()
        cursor.fetchone.side_effect = [
            (7, 15, "192.168.1.120", "Lobby EAP"),
            (last_heartbeat,),
        ]
        conn = make_connection(cursor)

        with (
            patch(
                "controllers.tplink.connection",
                new=AsyncMock(return_value=conn),
            ),
            patch.object(
                TplinkController,
                "_ping_ip",
                new=AsyncMock(return_value=True),
            ) as ping_ip,
        ):
            result = await TplinkController().get_status(7)

        self.assertTrue(result["reachable"])
        self.assertEqual(result["status"], "online")
        self.assertEqual(result["ip_address"], "192.168.1.120")
        self.assertEqual(result["device_name"], "Lobby EAP")
        self.assertEqual(result["last_heartbeat"], last_heartbeat.isoformat())
        ping_ip.assert_awaited_once_with("192.168.1.120")
        self.assertIn("RETURNING last_heartbeat_at", cursor.execute.await_args_list[1].args[0])
        self.assertEqual(cursor.execute.await_args_list[1].args[1], ("online", True, 7))
        self.assertEqual(cursor.execute.await_args_list[2].args[1], ("online", True, 15))
        conn.commit.assert_awaited_once()
        conn.close.assert_awaited_once()

    async def test_marks_ap_offline_when_ping_fails_without_refreshing_heartbeat(self):
        cursor = AsyncMock()
        cursor.fetchone.side_effect = [
            (7, None, "192.168.1.120", "Lobby EAP"),
            (None,),
        ]
        conn = make_connection(cursor)

        with (
            patch(
                "controllers.tplink.connection",
                new=AsyncMock(return_value=conn),
            ),
            patch.object(
                TplinkController,
                "_ping_ip",
                new=AsyncMock(return_value=False),
            ),
        ):
            result = await TplinkController().get_status(7)

        self.assertFalse(result["reachable"])
        self.assertEqual(result["status"], "offline")
        self.assertIsNone(result["last_heartbeat"])
        self.assertEqual(cursor.execute.await_args_list[1].args[1], ("offline", False, 7))
        self.assertEqual(cursor.execute.await_count, 2)

    async def test_invalid_ip_is_not_passed_to_ping(self):
        with (
            patch("controllers.tplink.shutil.which", return_value="/usr/bin/ping"),
            patch("controllers.tplink.asyncio.create_subprocess_exec") as spawn,
        ):
            reachable = await TplinkController._ping_ip("not-an-ip")

        self.assertFalse(reachable)
        spawn.assert_not_called()

    async def test_missing_ping_utility_is_reported(self):
        with patch("controllers.tplink.shutil.which", return_value=None):
            with self.assertRaises(HTTPException) as raised:
                await TplinkController._ping_ip("192.168.1.120")

        self.assertEqual(raised.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
