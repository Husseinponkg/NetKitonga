import asyncio
import sys
from decimal import Decimal
from pathlib import Path
from unittest import TestCase
from unittest.mock import AsyncMock, Mock, patch

from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.admin import AdminController
from services.disbursements import DisbursementPreflightError


class _Cursor:
    def __init__(self, rows):
        self.rows = iter(rows)
        self.executed = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return False

    async def execute(self, query, params=None):
        self.executed.append((query, params))

    async def fetchone(self):
        return next(self.rows)


class _Connection:
    def __init__(self, rows=()):
        self.test_cursor = _Cursor(rows)
        self.commit = AsyncMock()
        self.rollback = AsyncMock()
        self.close = AsyncMock()

    def cursor(self):
        return self.test_cursor


class AdminSystemCashoutTests(TestCase):
    def test_cashout_reserves_gross_and_sends_net_after_fee(self):
        reserve_connection = _Connection([("password-hash",), (Decimal("20000"),), (51,)])
        reference_connection = _Connection()
        disbursement = Mock()
        disbursement.send.return_value = {"pgReferenceId": "azam-ref"}

        with (
            patch(
                "controllers.admin.connection",
                AsyncMock(side_effect=[reserve_connection, reference_connection]),
            ),
            patch("controllers.admin.checkpw", return_value=True),
            patch("controllers.admin.DisbursementService", return_value=disbursement),
        ):
            result = asyncio.run(
                AdminController().create_system_cashout(
                    4,
                    "admin-password",
                    Decimal("10000"),
                    "0712345678",
                    "Mpesa",
                )
            )

        self.assertEqual(result["status"], "pending")
        self.assertEqual(result["gross_amount"], 10000)
        self.assertEqual(result["fee_amount"], 110)
        self.assertEqual(result["net_amount"], 9890)
        self.assertIn("SELECT pg_advisory_xact_lock", reserve_connection.test_cursor.executed[1][0])
        self.assertIn("INSERT INTO system_cashouts", reserve_connection.test_cursor.executed[3][0])
        self.assertEqual(disbursement.send.call_args.args[0:3], (9890.0, "0712345678", "Mpesa"))
        external_reference = disbursement.send.call_args.args[3]
        self.assertTrue(external_reference.startswith("NETKITONGA-WD-"))
        self.assertLessEqual(len(external_reference), 30)
        self.assertEqual(
            reference_connection.test_cursor.executed[0][1],
            ("azam-ref", 51),
        )
        reserve_connection.commit.assert_awaited_once()

    def test_cashout_requires_admin_password(self):
        connection = _Connection([("password-hash",)])
        with (
            patch("controllers.admin.connection", AsyncMock(return_value=connection)),
            patch("controllers.admin.checkpw", return_value=False),
            patch("controllers.admin.DisbursementService") as disbursement,
        ):
            with self.assertRaises(HTTPException) as error:
                asyncio.run(
                    AdminController().create_system_cashout(
                        4, "wrong", Decimal("1000"), "0712345678", "Mpesa"
                    )
                )

        self.assertEqual(error.exception.status_code, 401)
        disbursement.assert_not_called()
        connection.commit.assert_not_awaited()

    def test_cashout_cannot_exceed_available_revenue(self):
        connection = _Connection([("password-hash",), (Decimal("500"),)])
        with (
            patch("controllers.admin.connection", AsyncMock(return_value=connection)),
            patch("controllers.admin.checkpw", return_value=True),
            patch("controllers.admin.DisbursementService") as disbursement,
        ):
            with self.assertRaises(HTTPException) as error:
                asyncio.run(
                    AdminController().create_system_cashout(
                        4, "correct", Decimal("501"), "0712345678", "Mpesa"
                    )
                )

        self.assertEqual(error.exception.status_code, 400)
        self.assertIn("exceeds available", error.exception.detail)
        disbursement.assert_not_called()
        connection.commit.assert_not_awaited()

    def test_preflight_failure_releases_cashout_reservation(self):
        reserve_connection = _Connection([("password-hash",), (Decimal("20000"),), (51,)])
        status_connection = _Connection()
        disbursement = Mock()
        disbursement.send.side_effect = DisbursementPreflightError(
            "AzamPay disbursement settings are incomplete."
        )

        with (
            patch(
                "controllers.admin.connection",
                AsyncMock(side_effect=[reserve_connection, status_connection]),
            ),
            patch("controllers.admin.checkpw", return_value=True),
            patch("controllers.admin.DisbursementService", return_value=disbursement),
        ):
            result = asyncio.run(
                AdminController().create_system_cashout(
                    4,
                    "admin-password",
                    Decimal("10000"),
                    "0712345678",
                    "Mpesa",
                )
            )

        self.assertEqual(result["status"], "failed")
        self.assertIn("settings are incomplete", result["message"])
        self.assertIn("SET status = %s", status_connection.test_cursor.executed[0][0])
        self.assertEqual(
            status_connection.test_cursor.executed[0][1],
            ("failed", "failed", 51),
        )

    def test_unconfirmed_payout_error_is_preserved_and_reservation_remains_pending(self):
        reserve_connection = _Connection([("password-hash",), (Decimal("20000"),), (51,)])
        disbursement = Mock()
        disbursement.send.side_effect = HTTPException(
            status_code=502,
            detail="AzamPay disbursement outcome is unconfirmed (HTTP 503).",
        )

        with (
            patch("controllers.admin.connection", AsyncMock(return_value=reserve_connection)),
            patch("controllers.admin.checkpw", return_value=True),
            patch("controllers.admin.DisbursementService", return_value=disbursement),
        ):
            result = asyncio.run(
                AdminController().create_system_cashout(
                    4,
                    "admin-password",
                    Decimal("10000"),
                    "0712345678",
                    "Mpesa",
                )
            )

        self.assertEqual(result["status"], "pending")
        self.assertIn("HTTP 503", result["message"])
        self.assertIn("remains pending", result["message"])
        self.assertEqual(len(reserve_connection.test_cursor.executed), 4)


if __name__ == "__main__":
    import unittest

    unittest.main()
