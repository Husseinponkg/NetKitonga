import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.payments import PaymentController


def make_connection(cursor):
    cursor_context = MagicMock()
    cursor_context.__aenter__ = AsyncMock(return_value=cursor)
    cursor_context.__aexit__ = AsyncMock(return_value=False)

    conn = MagicMock()
    conn.cursor.return_value = cursor_context
    conn.close = AsyncMock()
    return conn


class ActivePortalSessionTests(unittest.TestCase):
    def test_returns_existing_paid_session_token(self):
        cursor = AsyncMock()
        cursor.fetchone.return_value = ("existing-session-token",)
        conn = make_connection(cursor)

        with patch(
            "controllers.payments.connection",
            new=AsyncMock(return_value=conn),
        ):
            result = asyncio.run(
                PaymentController().get_active_portal_session(
                    router_id=8,
                    buyer_mac="aa-bb-cc-dd-ee-ff",
                )
            )

        self.assertEqual(
            result,
            {
                "active": True,
                "auth_token": "existing-session-token",
            },
        )
        query, params = cursor.execute.await_args.args
        self.assertIn("s.expiration_time > NOW()", query)
        self.assertIn("s.status = 'active'", query)
        self.assertEqual(params, (8, "AA:BB:CC:DD:EE:FF"))
        conn.close.assert_awaited_once()

    def test_reports_no_active_session_without_creating_a_purchase(self):
        cursor = AsyncMock()
        cursor.fetchone.return_value = None
        conn = make_connection(cursor)

        with patch(
            "controllers.payments.connection",
            new=AsyncMock(return_value=conn),
        ):
            result = asyncio.run(
                PaymentController().get_active_portal_session(
                    router_id=8,
                    buyer_mac="AA:BB:CC:DD:EE:FF",
                )
            )

        self.assertEqual(result, {"active": False})
        conn.close.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
