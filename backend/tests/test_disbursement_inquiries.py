import os
import sys
from pathlib import Path
from unittest import TestCase
from unittest.mock import Mock, patch

from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.disbursements import DisbursementRejected, DisbursementService


class DisbursementInquiryTests(TestCase):
    def test_get_bank_names_uses_configured_url_without_auth(self):
        response = Mock(ok=True)
        response.json.return_value = ["Azampesa"]
        with (
            patch.dict(os.environ, {"AZAMPAY_BANK_NAMES_URL": "https://example.test/banks"}),
            patch("services.disbursements.requests.get", return_value=response) as get,
        ):
            result = DisbursementService().get_bank_names()

        self.assertEqual(result, ["Azampesa"])
        get.assert_called_once_with(
            "https://example.test/banks",
            headers={"Accept": "text/plain"},
            params=None,
            timeout=15,
        )

    def test_check_balance_uses_bearer_token(self):
        response = Mock(ok=True)
        response.text = "1000"
        response.json.side_effect = ValueError
        with (
            patch.dict(
                os.environ,
                {"AZAMPAY_CHECK_BALANCE_URL": "https://example.test/checkbalance"},
            ),
            patch("services.disbursements.requests.get", return_value=response) as get,
        ):
            service = DisbursementService()
            service._get_bearer_token = lambda: "test-token"
            result = service.check_balance("Azampesa")

        self.assertEqual(result, "1000")
        get.assert_called_once_with(
            "https://example.test/checkbalance/azampesa",
            headers={"Accept": "text/plain", "Authorization": "Bearer test-token"},
            params=None,
            timeout=15,
        )

    def test_transaction_status_sends_query_parameters_and_bearer_token(self):
        response = Mock(ok=True)
        response.json.return_value = {"status": "success"}
        with (
            patch.dict(
                os.environ,
                {"AZAMPAY_TRANSACTION_STATUS_URL": "https://example.test/transactionstatus"},
            ),
            patch("services.disbursements.requests.get", return_value=response) as get,
        ):
            service = DisbursementService()
            service._get_bearer_token = lambda: "test-token"
            result = service.get_transaction_status("reference-123")

        self.assertEqual(result, {"status": "success"})
        get.assert_called_once_with(
            "https://example.test/transactionstatus",
            headers={"Accept": "text/plain", "Authorization": "Bearer test-token"},
            params={"pgReferenceId": "reference-123", "bankName": "Azampesa"},
            timeout=15,
        )

    def test_inquiry_provider_errors_are_reported(self):
        response = Mock(ok=False, status_code=401)
        with patch("services.disbursements.requests.get", return_value=response):
            with self.assertRaises(HTTPException) as error:
                DisbursementService().get_bank_names()

        self.assertEqual(error.exception.status_code, 502)
        self.assertIn("HTTP 401", error.exception.detail)

    def test_explicit_provider_failure_is_reported_as_rejection(self):
        response = Mock(status_code=200)
        response.json.return_value = {
            "success": False,
            "message": "Balance can not be negative",
        }
        with (
            patch.object(DisbursementService, "_get_bearer_token", return_value="token"),
            patch.object(DisbursementService, "_generate_checksum", return_value="checksum"),
            patch("services.disbursements.requests.post", return_value=response),
        ):
            with self.assertRaises(DisbursementRejected) as error:
                DisbursementService().send(
                    1930,
                    "255700000000",
                    "Azampesa",
                    "TEST-REFERENCE",
                )

        self.assertIn("Balance can not be negative", str(error.exception))
