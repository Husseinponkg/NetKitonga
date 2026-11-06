import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.withdrawals import WithdrawalController, available_cash_balance

from pydantic import ValidationError
from models.withdrawals import WithdrawalRequest


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
        self.commit = AsyncMock()
        self.close = AsyncMock()

    def cursor(self):
        return self.test_cursor


class AvailableCashBalanceTests(unittest.TestCase):
    def test_balance_uses_mobile_money_earnings_less_withdrawals(self):
        self.assertEqual(available_cash_balance(125.50, 25.25), 100.25)

    def test_withdrawals_cannot_exceed_mobile_money_earnings(self):
        self.assertEqual(available_cash_balance(25, 40), 0)

    def test_missing_values_are_treated_as_zero(self):
        self.assertEqual(available_cash_balance(None, None), 0)

    def test_pending_withdrawals_reduce_available_balance(self):
        self.assertEqual(available_cash_balance(8000, 2000, 3000), 3000)

    def test_wallet_balance_excludes_pending_withdrawals(self):
        connection = _Connection([(2000,), (8000,), (3000,)])

        with patch(
            "controllers.withdrawals.connection",
            AsyncMock(return_value=connection),
        ):
            balance = asyncio.run(WithdrawalController().get_wallet_balance(7))

        self.assertEqual(balance["current_balance"], 3000)
        self.assertEqual(balance["total_withdrawn"], 2000)
        connection.close.assert_awaited_once()

    def test_request_cannot_exceed_balance_after_pending_withdrawals(self):
        connection = _Connection([(1, 2000), (8000,), (3000,)])
        request = WithdrawalRequest(
            amount=4000,
            mobile_money_number="0712345678",
            payout_provider="Mpesa",
        )

        with patch(
            "controllers.withdrawals.connection",
            AsyncMock(return_value=connection),
        ), patch("controllers.withdrawals.DisbursementService.send") as send:
            with self.assertRaises(HTTPException) as error:
                asyncio.run(WithdrawalController().request_withdrawal(7, request))

        self.assertEqual(error.exception.status_code, 400)
        self.assertIn("Insufficient wallet balance", error.exception.detail)
        send.assert_not_called()
        self.assertEqual(len(connection.test_cursor.executed), 3)
        connection.close.assert_awaited_once()

    def test_withdrawal_records_fee_split_consistent_with_total_deduction(self):
        connection = _Connection([(1, 0), (10000,), (0,), (88,)])
        request = WithdrawalRequest(
            amount=2035,
            mobile_money_number="0712345678",
            payout_provider="Mpesa",
        )

        with patch(
            "controllers.withdrawals.connection",
            AsyncMock(return_value=connection),
        ), patch("controllers.withdrawals.DisbursementService.send", return_value={}) as send:
            result = asyncio.run(WithdrawalController().request_withdrawal(7, request))

        insert_params = connection.test_cursor.executed[3][1]
        _, _, amount, commission, system_commission, azampay_fee = insert_params[:6]
        self.assertEqual(result["status"], "pending")
        self.assertEqual(commission, system_commission + azampay_fee)
        send.assert_called_once()
        self.assertEqual(
            send.call_args.args[:3],
            (round(amount - commission, 2), "0712345678", "Mpesa"),
        )
        self.assertTrue(send.call_args.args[3].startswith("NETKITONGA-WD-"))
        connection.commit.assert_awaited_once()

    def test_withdrawal_provider_must_be_mobile_money(self):
        with self.assertRaises(ValidationError):
            WithdrawalRequest(
                amount=100,
                mobile_money_number="0712345678",
                payout_provider="Voucher",
            )


if __name__ == "__main__":
    unittest.main()
