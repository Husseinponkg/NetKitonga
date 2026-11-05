import os
import sys
from pathlib import Path
from unittest import TestCase
from unittest.mock import Mock, patch

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi import HTTPException
from services import azampay_callback_key


class AzamPayCallbackKeyTests(TestCase):
    def setUp(self):
        azampay_callback_key._callback_key_cache = None
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.public_key_pem = private_key.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()

    def tearDown(self):
        azampay_callback_key._callback_key_cache = None

    def test_fetches_and_caches_checkout_public_key(self):
        auth_response = Mock(status_code=200)
        auth_response.json.return_value = {"data": {"accessToken": "checkout-token"}}
        key_response = Mock(ok=True)
        key_response.json.return_value = {"success": True, "publicKey": self.public_key_pem}

        with (
            patch.dict(
                os.environ,
                {
                    "AZAMPAY_APP_NAME": "test-app",
                    "AZAMPAY_CLIENT_ID": "test-client",
                    "AZAMPAY_CLIENT_SECRET": "test-secret",
                    "AZAMPAY_API_KEY": "test-api-key",
                    "AZAMPAY_MNO": "https://checkout.azampay.co.tz/azampay/mno/checkout",
                    "AZAMPAY_AUTH_URL": "https://authenticator.azampay.co.tz/token",
                },
                clear=True,
            ),
            patch(
                "services.azampay_callback_key.requests.post",
                return_value=auth_response,
            ) as post,
            patch(
                "services.azampay_callback_key.requests.get",
                return_value=key_response,
            ) as get,
        ):
            first_key = azampay_callback_key.get_callback_public_key()
            cached_key = azampay_callback_key.get_callback_public_key()

        self.assertEqual(first_key, self.public_key_pem)
        self.assertEqual(cached_key, self.public_key_pem)
        post.assert_called_once_with(
            "https://authenticator.azampay.co.tz/token",
            json={
                "appName": "test-app",
                "clientId": "test-client",
                "clientSecret": "test-secret",
            },
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=10,
        )
        get.assert_called_once_with(
            "https://checkout.azampay.co.tz/azampay/v1/public-key?format=Pem",
            headers={
                "Accept": "application/json",
                "Authorization": "Bearer checkout-token",
                "X-API-Key": "test-api-key",
            },
            timeout=10,
        )

    def test_refresh_fetches_new_provider_key(self):
        auth_response = Mock(status_code=200)
        auth_response.json.return_value = {"token": "checkout-token"}
        key_response = Mock(ok=True)
        key_response.json.return_value = {"publicKey": self.public_key_pem}
        with (
            patch.dict(
                os.environ,
                {
                    "AZAMPAY_APP_NAME": "test-app",
                    "AZAMPAY_CLIENT_ID": "test-client",
                    "AZAMPAY_CLIENT_SECRET": "test-secret",
                },
                clear=True,
            ),
            patch(
                "services.azampay_callback_key.requests.post",
                return_value=auth_response,
            ) as post,
            patch(
                "services.azampay_callback_key.requests.get",
                return_value=key_response,
            ) as get,
        ):
            cached_key = azampay_callback_key.get_callback_public_key()
            refreshed_key = azampay_callback_key.get_callback_public_key(
                force_refresh=True
            )

        self.assertEqual(cached_key, self.public_key_pem)
        self.assertEqual(refreshed_key, self.public_key_pem)
        self.assertEqual(post.call_count, 2)
        self.assertEqual(get.call_count, 2)

    def test_provider_failure_is_reported_without_response_body(self):
        auth_response = Mock(status_code=423)
        auth_response.text = "secret provider details"
        with (
            patch.dict(
                os.environ,
                {
                    "AZAMPAY_APP_NAME": "test-app",
                    "AZAMPAY_CLIENT_ID": "test-client",
                    "AZAMPAY_CLIENT_SECRET": "test-secret",
                },
                clear=True,
            ),
            patch(
                "services.azampay_callback_key.requests.post",
                return_value=auth_response,
            ),
        ):
            with self.assertRaises(HTTPException) as error:
                azampay_callback_key.get_callback_public_key(force_refresh=True)

        self.assertEqual(error.exception.status_code, 502)
        self.assertIn("HTTP 423", error.exception.detail)
        self.assertNotIn("secret provider details", error.exception.detail)
