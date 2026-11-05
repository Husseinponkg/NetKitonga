import asyncio
import os
import sys
from pathlib import Path
from unittest import TestCase
from unittest.mock import AsyncMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.payments import PaymentController


class _Cursor:
    def __init__(self, rows):
        self.executed = []
        self.rows = iter(rows)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return False

    async def execute(self, query, params):
        self.executed.append((query, params))

    async def fetchone(self):
        return next(self.rows)


class _Connection:
    def __init__(self, rows):
        self.test_cursor = _Cursor(rows)
        self.commit = AsyncMock()
        self.close = AsyncMock()

    def cursor(self):
        return self.test_cursor


class PaymentCallbackReferenceTests(TestCase):
    def test_successful_callback_completes_pending_payment_by_merchant_reference(self):
        connection = _Connection([
            (1, 2, 1000, "pending", "AzamPay"),
            (2, 3, 4, 5, 6),
            (3600,),
        ])
        with (
            patch.dict(os.environ, {"AZAMPAY_CALLBACK_PUBLIC_KEY": ""}),
            patch("controllers.payments.connection", AsyncMock(return_value=connection)),
        ):
            acknowledged = asyncio.run(
                PaymentController().process_asynchronous_callback(
                    external_id="AZAM-PAY-UTILITY-REFERENCE",
                    is_successful=True,
                    external_reference="NETKITONGA-MERCHANT-REFERENCE",
                )
            )

        self.assertTrue(acknowledged)
        lookup_query, lookup_params = connection.test_cursor.executed[0]
        self.assertIn("ORDER BY CASE gateway_reference", lookup_query)
        self.assertEqual(
            lookup_params,
            (
                "NETKITONGA-MERCHANT-REFERENCE",
                "AZAM-PAY-UTILITY-REFERENCE",
                "NETKITONGA-MERCHANT-REFERENCE",
            ),
        )
        status_update = next(
            (query, params)
            for query, params in connection.test_cursor.executed
            if "UPDATE payments SET status" in query
        )
        self.assertEqual(status_update[1], ("completed", None, 1))
        connection.commit.assert_awaited_once()
        connection.close.assert_awaited_once()
