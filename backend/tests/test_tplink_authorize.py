import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.tplink import TplinkController
from models.tplink import TplinkAuthorizeRequest


def make_connection(cursor):
    cursor_context = MagicMock()
    cursor_context.__aenter__ = AsyncMock(return_value=cursor)
    cursor_context.__aexit__ = AsyncMock(return_value=False)

    conn = MagicMock()
    conn.cursor.return_value = cursor_context
    conn.close = AsyncMock()
    return conn


def make_payload():
    return TplinkAuthorizeRequest(
        router_id=15,
        buyerMac="AA-BB-CC-DD-EE-FF",
        auth_token="paid-session-token",
        clientIp="192.168.1.55",
        apMac="10-5A-95-51-D4-E4",
        ssidName="Guest WiFi",
        radioId=1,
        site="Rchuganet",
        t="1730000000000000",
        redirectUrl="https://example.com/",
    )


class TplinkAuthorizationTests(unittest.IsolatedAsyncioTestCase):
    async def test_authorizes_only_matching_active_paid_session(self):
        cursor = AsyncMock()
        cursor.fetchone.return_value = (1_730_000_000_000_000,)
        conn = make_connection(cursor)
        controller = TplinkController()

        with (
            patch(
                "controllers.tplink.connection",
                new=AsyncMock(return_value=conn),
            ),
            patch(
                "controllers.tplink.asyncio.to_thread",
                new=AsyncMock(return_value=None),
            ) as to_thread,
        ):
            result = await controller.authorize_portal_client(make_payload())

        self.assertEqual(result, {"authorized": True})
        query, params = cursor.execute.await_args.args
        self.assertIn("p.status = 'completed'", query)
        self.assertIn("s.status = 'active'", query)
        self.assertIn("s.expiration_time > NOW()", query)
        self.assertIn("FROM tplink t", query)
        self.assertEqual(
            params,
            (15, "paid-session-token", "AABBCCDDEEFF", "105A9551D4E4"),
        )
        self.assertEqual(to_thread.await_args.args[2], 1_730_000_000_000_000)
        conn.close.assert_awaited_once()

    async def test_does_not_contact_omada_without_an_active_paid_session(self):
        cursor = AsyncMock()
        cursor.fetchone.return_value = None
        conn = make_connection(cursor)
        controller = TplinkController()

        with (
            patch(
                "controllers.tplink.connection",
                new=AsyncMock(return_value=conn),
            ),
            patch(
                "controllers.tplink.asyncio.to_thread",
                new=AsyncMock(),
            ) as to_thread,
        ):
            with self.assertRaises(HTTPException) as raised:
                await controller.authorize_portal_client(make_payload())

        self.assertEqual(raised.exception.status_code, 403)
        to_thread.assert_not_awaited()
        conn.close.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
