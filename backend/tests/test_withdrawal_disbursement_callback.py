import asyncio
import sys
from pathlib import Path
from unittest import TestCase
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers import withdrawals


class _Cursor:
    def __init__(self, row):
        self.row = row
        self.executed = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return False

    async def execute(self, query, params):
        self.executed.append((query, params))

    async def fetchone(self):
        return self.row


class _Connection:
    def __init__(self, withdrawal):
        self.test_cursor = _Cursor(withdrawal)
        self.commit = AsyncMock()
        self.close = AsyncMock()

    def cursor(self):
        return self.test_cursor


class DisbursementCallbackTests(TestCase):
    def _process_callback(self, withdrawal, payload):
        connection = _Connection(withdrawal)
        with patch(
            "controllers.withdrawals.connection",
            AsyncMock(return_value=connection),
        ):
            result = asyncio.run(
                withdrawals.WithdrawalController().process_disbursement_callback(
                    payload
                )
            )
        return result, connection

    def test_successful_callback_approves_and_deducts_once(self):
        result, connection = self._process_callback(
            (7, 3, 2000, "pending"),
            {"pgReferenceId": "azampay-ref", "status": "success"},
        )

        self.assertEqual(result["withdrawal_status"], "approved")
        statements = connection.test_cursor.executed
        self.assertEqual(len(statements), 3)
        self.assertIn("UPDATE withdrawals SET status", statements[1][0])
        self.assertEqual(statements[1][1], ("approved", 7))
        self.assertIn("UPDATE tenant_wallets SET total_withdrawn", statements[2][0])
        self.assertEqual(statements[2][1], (2000, 2000, 3))
        connection.commit.assert_awaited_once()

    def test_failed_callback_rejects_pending_without_wallet_deduction(self):
        result, connection = self._process_callback(
            (7, 3, 2000, "pending"),
            {"pgReferenceId": "azampay-ref", "status": "failure"},
        )

        self.assertEqual(result["withdrawal_status"], "rejected")
        self.assertEqual(len(connection.test_cursor.executed), 2)
        self.assertIn("UPDATE withdrawals SET status", connection.test_cursor.executed[1][0])
        self.assertEqual(connection.test_cursor.executed[1][1], ("rejected", 7))
        connection.commit.assert_awaited_once()

    def test_failed_callback_refunds_legacy_early_approved_withdrawal(self):
        result, connection = self._process_callback(
            (7, 3, 2000, "approved"),
            {"pgReferenceId": "azampay-ref", "status": "failure"},
        )

        self.assertEqual(result["withdrawal_status"], "rejected")
        statements = connection.test_cursor.executed
        self.assertEqual(len(statements), 3)
        self.assertEqual(statements[1][1], (7,))
        self.assertIn("UPDATE tenant_wallets SET total_withdrawn", statements[2][0])
        self.assertEqual(statements[2][1], (2000, 2000, 3))
        connection.commit.assert_awaited_once()

    def test_duplicate_success_callback_does_not_deduct_twice(self):
        result, connection = self._process_callback(
            (7, 3, 2000, "approved"),
            {"pgReferenceId": "azampay-ref", "status": "success"},
        )

        self.assertEqual(result["withdrawal_status"], "approved")
        self.assertEqual(len(connection.test_cursor.executed), 1)
        connection.commit.assert_awaited_once()

    def test_unknown_callback_status_is_rejected_without_database_access(self):
        with patch("controllers.withdrawals.connection", AsyncMock()) as connect:
            with self.assertRaises(HTTPException) as error:
                asyncio.run(
                    withdrawals.WithdrawalController().process_disbursement_callback(
                        {"pgReferenceId": "azampay-ref", "status": "processing"}
                    )
                )

        self.assertEqual(error.exception.status_code, 400)
        self.assertIn("Unrecognized", error.exception.detail)
        connect.assert_not_awaited()
