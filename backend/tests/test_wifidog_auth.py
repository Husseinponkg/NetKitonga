import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from routes.routers import wifidog_auth


def make_connection(cursor):
    cursor_context = MagicMock()
    cursor_context.__aenter__ = AsyncMock(return_value=cursor)
    cursor_context.__aexit__ = AsyncMock(return_value=False)

    conn = MagicMock()
    conn.cursor.return_value = cursor_context
    conn.close = AsyncMock()
    return conn


class WiFiDogAuthTests(unittest.IsolatedAsyncioTestCase):
    async def test_token_login_returns_remaining_session_timeout(self):
        cursor = AsyncMock()
        cursor.fetchone.return_value = (3598,)
        conn = make_connection(cursor)

        with patch("routes.routers.connection", new=AsyncMock(return_value=conn)):
            response = await wifidog_auth(
                gw_id="ruijie-lobby",
                token="paid-session-token",
                stage="login",
            )

        self.assertEqual(response.body.decode(), "Auth: 1\nTimeout: 3598\n")
        query, _ = cursor.execute.await_args.args
        self.assertIn("s.expiration_time - NOW()", query)
        conn.close.assert_awaited_once()

    async def test_regular_auth_check_returns_remaining_session_timeout(self):
        cursor = AsyncMock()
        cursor.fetchone.side_effect = [(12, 7), (42,), (3560,)]
        conn = make_connection(cursor)

        with patch("routes.routers.connection", new=AsyncMock(return_value=conn)):
            response = await wifidog_auth(
                gw_id="ruijie-lobby",
                mac="AA:BB:CC:DD:EE:FF",
                ip="10.0.0.42",
            )

        self.assertEqual(response.body.decode(), "Auth: 1\nTimeout: 3560\n")
        session_query, _ = cursor.execute.await_args_list[2].args
        self.assertIn("expiration_time - NOW()", session_query)
        conn.close.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
