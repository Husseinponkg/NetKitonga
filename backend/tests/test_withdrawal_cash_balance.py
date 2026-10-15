import unittest
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.withdrawals import available_cash_balance

from pydantic import ValidationError
from models.withdrawals import WithdrawalRequest

class AvailableCashBalanceTests(unittest.TestCase):
    def test_balance_uses_mobile_money_earnings_less_withdrawals(self):
        self.assertEqual(available_cash_balance(125.50, 25.25), 100.25)

    def test_withdrawals_cannot_exceed_mobile_money_earnings(self):
        self.assertEqual(available_cash_balance(25, 40), 0)

    def test_missing_values_are_treated_as_zero(self):
        self.assertEqual(available_cash_balance(None, None), 0)

    def test_withdrawal_provider_must_be_mobile_money(self):
        with self.assertRaises(ValidationError):
            WithdrawalRequest(
                amount=100,
                mobile_money_number="0712345678",
                payout_provider="Voucher",
            )


if __name__ == "__main__":
    unittest.main()
