import asyncio
import sys
from pathlib import Path
from unittest import TestCase
from unittest.mock import AsyncMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.admin import AdminController


class _Cursor:
    def __init__(self, row):
        self.row = row
        self.executed = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return False

    async def execute(self, query):
        self.executed.append(query)

    async def fetchone(self):
        return self.row


class _Connection:
    def __init__(self, row):
        self.test_cursor = _Cursor(row)
        self.close = AsyncMock()

    def cursor(self):
        return self.test_cursor


class AdminSystemRevenueTests(TestCase):
    def test_report_sums_successful_commissions_and_subscription_payments(self):
        connection = _Connection((350, 20000, 10, 2))
        with patch(
            "controllers.admin.connection",
            AsyncMock(return_value=connection),
        ):
            result = asyncio.run(AdminController().get_system_revenue())

        self.assertEqual(
            result,
            {
                "currency": "TZS",
                "withdrawal_commissions": 350.0,
                "subscription_payments": 20000.0,
                "total_recorded_revenue": 20350.0,
                "successful_withdrawals": 10,
                "successful_subscriptions": 2,
            },
        )
        self.assertIn("subscription_payments", connection.test_cursor.executed[0])
        connection.close.assert_awaited_once()


if __name__ == "__main__":
    import unittest

    unittest.main()
