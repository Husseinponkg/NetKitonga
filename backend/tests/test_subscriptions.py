import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import TestCase
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from unittest.mock import Mock
from starlette.requests import Request

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.subscriptions import SubscriptionController
from utils.subscription_access import require_active_subscription


class _Cursor:
    def __init__(self, rows):
        self.rows = iter(rows)
        self.executed = []

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
        self.close = AsyncMock()
        self.commit = AsyncMock()
        self.rollback = AsyncMock()

    def cursor(self):
        return self.test_cursor


class SubscriptionStatusTests(TestCase):
    def test_checkout_records_monthly_subscription_payment(self):
        connection = _Connection([(3,)])
        payment_service = Mock()
        payment_service._normalize_phone.return_value = "255712345678"
        payment_service._normalize_provider.return_value = "Mpesa"
        payment_service._get_bearer_token.return_value = "token"
        payment_service.api_key = "test-api-key"
        response = Mock(status_code=200)
        response.json.return_value = {"success": True}

        with (
            patch(
                "controllers.subscriptions.connection",
                AsyncMock(return_value=connection),
            ),
            patch(
                "controllers.subscriptions.PaymentService",
                return_value=payment_service,
            ),
            patch("controllers.subscriptions.requests.post", return_value=response),
        ):
            result = asyncio.run(
                SubscriptionController().checkout(3, "0712345678", "Mpesa")
            )

        self.assertEqual(result["message"], "Subscription checkout initiated.")
        insert_query, insert_params = connection.test_cursor.executed[2]
        self.assertIn("INSERT INTO subscription_payments", insert_query)
        self.assertEqual(insert_params[:2], (3, 10000.0))
        self.assertTrue(insert_params[2].startswith("NETKITONGA-SUB-"))
        connection.commit.assert_awaited_once()
        connection.close.assert_awaited_once()

    def test_registration_date_starts_30_day_trial(self):
        created_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=10)
        connection = _Connection([("trial", None, created_at)])
        with patch(
            "controllers.subscriptions.connection",
            AsyncMock(return_value=connection),
        ):
            result = asyncio.run(SubscriptionController().get_status(3))

        self.assertTrue(result["active"])
        self.assertEqual(result["subscription_status"], "trial")
        self.assertEqual(
            result["trial_ends_at"],
            (created_at + timedelta(days=30)).isoformat(),
        )

    def test_expired_trial_is_not_active(self):
        created_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=31)
        connection = _Connection([("trial", None, created_at)])
        with patch(
            "controllers.subscriptions.connection",
            AsyncMock(return_value=connection),
        ):
            result = asyncio.run(SubscriptionController().get_status(3))

        self.assertFalse(result["active"])
        self.assertEqual(result["subscription_status"], "expired")

    def test_failed_trial_tenant_cannot_use_tenant_api(self):
        created_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=31)
        connection = _Connection([("trial", None, created_at)])
        request = Request(
            {
                "type": "http",
                "method": "GET",
                "path": "/packages/catalog",
                "query_string": b"tenant_id=3",
                "headers": [],
                "server": ("test", 80),
                "client": ("test", 1234),
                "scheme": "http",
            }
        )
        with patch(
            "utils.subscription_access.connection",
            AsyncMock(return_value=connection),
        ):
            with self.assertRaises(HTTPException) as error:
                asyncio.run(require_active_subscription(request))

        self.assertEqual(error.exception.status_code, 402)
        connection.close.assert_awaited_once()

    def test_active_registration_trial_can_use_tenant_api(self):
        created_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=10)
        connection = _Connection([("trial", None, created_at)])
        request = Request(
            {
                "type": "http",
                "method": "GET",
                "path": "/packages/catalog",
                "query_string": b"tenant_id=3",
                "headers": [],
                "server": ("test", 80),
                "client": ("test", 1234),
                "scheme": "http",
            }
        )
        with patch(
            "utils.subscription_access.connection",
            AsyncMock(return_value=connection),
        ):
            asyncio.run(require_active_subscription(request))

        connection.close.assert_awaited_once()

    def test_successful_payment_callback_records_revenue_and_extends_period(self):
        connection = _Connection([(8, 3, "pending")])
        with (
            patch(
                "controllers.subscriptions.connection",
                AsyncMock(return_value=connection),
            ),
            patch(
                "controllers.subscriptions.PaymentController.verify_callback_signature",
                new=AsyncMock(),
            ),
        ):
            result = asyncio.run(
                SubscriptionController().callback(
                    {
                        "externalId": "sub-ref",
                        "status": "success",
                        "signature": "signed",
                    }
                )
            )

        self.assertEqual(result, {"status": "acknowledged"})
        statements = connection.test_cursor.executed
        self.assertEqual(len(statements), 3)
        self.assertIn("GREATEST", statements[1][0])
        self.assertEqual(statements[1][1], (3,))
        self.assertIn("SET status = 'completed', paid_at = NOW()", statements[2][0])
        self.assertEqual(statements[2][1], (8,))
        connection.commit.assert_awaited_once()

    def test_duplicate_payment_callback_does_not_extend_again(self):
        connection = _Connection([(8, 3, "completed")])
        with (
            patch(
                "controllers.subscriptions.connection",
                AsyncMock(return_value=connection),
            ),
            patch(
                "controllers.subscriptions.PaymentController.verify_callback_signature",
                new=AsyncMock(),
            ),
        ):
            result = asyncio.run(
                SubscriptionController().callback(
                    {
                        "externalId": "sub-ref",
                        "status": "success",
                        "signature": "signed",
                    }
                )
            )

        self.assertEqual(result, {"status": "acknowledged"})
        self.assertEqual(len(connection.test_cursor.executed), 1)

    def test_failed_callback_marks_payment_failed_without_changing_entitlement(self):
        connection = _Connection([(8, 3, "pending")])
        with (
            patch(
                "controllers.subscriptions.connection",
                AsyncMock(return_value=connection),
            ),
            patch(
                "controllers.subscriptions.PaymentController.verify_callback_signature",
                new=AsyncMock(),
            ),
        ):
            result = asyncio.run(
                SubscriptionController().callback(
                    {
                        "externalId": "sub-ref",
                        "status": "failure",
                        "signature": "signed",
                    }
                )
            )

        self.assertEqual(result, {"status": "acknowledged"})
        self.assertEqual(len(connection.test_cursor.executed), 2)
        self.assertIn("SET status = 'failed'", connection.test_cursor.executed[1][0])

    def test_subscription_callback_requires_valid_signature_before_database_access(self):
        with patch(
            "controllers.subscriptions.connection",
            AsyncMock(),
        ) as connect:
            with self.assertRaises(HTTPException) as error:
                asyncio.run(
                    SubscriptionController().callback(
                        {"externalId": "sub-ref", "status": "success"}
                    )
                )

        self.assertEqual(error.exception.status_code, 401)
        connect.assert_not_awaited()


if __name__ == "__main__":
    import unittest

    unittest.main()
