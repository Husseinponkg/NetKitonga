import asyncio
import base64
import os
import sys
from pathlib import Path
from unittest import TestCase
from unittest.mock import AsyncMock, patch

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from controllers.payments import PaymentController
from routes import payment as payment_route


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
    def test_successful_callback_completes_pending_payment_by_utility_reference(self):
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
                    external_id="NETKITONGA-MERCHANT-REFERENCE",
                    is_successful=True,
                    external_reference="AZAM-PAY-PROVIDER-REFERENCE",
                )
            )

        self.assertTrue(acknowledged)
        lookup_query, lookup_params = connection.test_cursor.executed[0]
        self.assertIn("ORDER BY CASE gateway_reference", lookup_query)
        self.assertEqual(
            lookup_params,
            (
                "NETKITONGA-MERCHANT-REFERENCE",
                "AZAM-PAY-PROVIDER-REFERENCE",
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

    def test_callback_route_passes_azampay_reference_fields_and_raw_status(self):
        callback_processor = AsyncMock(return_value=True)
        payload = {
            "utilityref": "NETKITONGA-MERCHANT-REFERENCE",
            "externalreference": "AZAM-PAY-PROVIDER-REFERENCE",
            "transactionstatus": "failure",
            "operator": "Airtel",
            "amount": "1000",
            "transid": "provider-transaction-id",
        }

        with patch.object(payment_route, "controller") as controller:
            controller.process_asynchronous_callback = callback_processor
            response = asyncio.run(
                payment_route.handle_azampay_gateway_callback(payload)
            )

        self.assertEqual(response, {"status": "acknowledged", "code": 200})
        callback_processor.assert_awaited_once_with(
            "NETKITONGA-MERCHANT-REFERENCE",
            False,
            "1000",
            "Airtel",
            None,
            "AZAM-PAY-PROVIDER-REFERENCE",
            "provider-transaction-id",
            "failure",
        )

    def test_signature_verification_uses_original_provider_status(self):
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_key_pem = private_key.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()
        signed_message = (
            "NETKITONGA-MERCHANT-REFERENCE"
            "AZAM-PAY-PROVIDER-REFERENCE"
            "failure"
            "Airtel"
        )
        signature = base64.b64encode(
            private_key.sign(
                signed_message.encode(),
                padding.PKCS1v15(),
                hashes.SHA256(),
            )
        ).decode()
        connection = _Connection([
            (1, 2, 1000, "failed", "AzamPay"),
        ])

        with (
            patch.dict(os.environ, {"AZAMPAY_CALLBACK_PUBLIC_KEY": public_key_pem}),
            patch("controllers.payments.connection", AsyncMock(return_value=connection)),
        ):
            acknowledged = asyncio.run(
                PaymentController().process_asynchronous_callback(
                    external_id="NETKITONGA-MERCHANT-REFERENCE",
                    is_successful=False,
                    operator="Airtel",
                    signature=signature,
                    external_reference="AZAM-PAY-PROVIDER-REFERENCE",
                    callback_status="failure",
                )
            )

        self.assertTrue(acknowledged)
        connection.commit.assert_awaited_once()

    def test_configured_callback_key_rejects_missing_signature(self):
        with (
            patch.dict(
                os.environ,
                {"AZAMPAY_CALLBACK_PUBLIC_KEY": "configured-public-key"},
            ),
            patch("controllers.payments.connection", AsyncMock()) as connect,
        ):
            acknowledged = asyncio.run(
                PaymentController().process_asynchronous_callback(
                    external_id="NETKITONGA-MERCHANT-REFERENCE",
                    is_successful=True,
                )
            )

        self.assertFalse(acknowledged)
        connect.assert_not_awaited()
