import os
import threading
import time
from typing import Any
from urllib.parse import urlsplit

import requests
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey
from fastapi import HTTPException

_CALLBACK_KEY_CACHE_SECONDS = 24 * 60 * 60
_callback_key_cache: tuple[float, str] | None = None
_callback_key_lock = threading.Lock()


def _response_body(response: requests.Response) -> Any:
    try:
        return response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=502,
            detail="AzamPay returned an invalid response while retrieving its callback key.",
        ) from error


def _callback_public_key_url() -> str:
    configured_url = os.getenv("AZAMPAY_CALLBACK_PUBLIC_KEY_URL")
    if not configured_url:
        checkout_url = os.getenv(
            "AZAMPAY_MNO",
            os.getenv(
                "AZAMPAY_CHECKOUT_URL",
                "https://checkout.azampay.co.tz/azampay/mno/checkout",
            ),
        )
        parsed_url = urlsplit(checkout_url)
        if parsed_url.scheme != "https" or not parsed_url.netloc:
            raise HTTPException(
                status_code=500,
                detail="AzamPay checkout URL must be HTTPS to retrieve its callback key.",
            )
        configured_url = (
            f"{parsed_url.scheme}://{parsed_url.netloc}"
            "/azampay/v1/public-key?format=Pem"
        )

    parsed_url = urlsplit(configured_url)
    if parsed_url.scheme != "https" or not parsed_url.netloc:
        raise HTTPException(
            status_code=500,
            detail="AzamPay callback public-key URL must use HTTPS.",
        )
    return configured_url


def _validate_https_url(url: str, setting_name: str) -> None:
    parsed_url = urlsplit(url)
    if parsed_url.scheme != "https" or not parsed_url.netloc:
        raise HTTPException(
            status_code=500,
            detail=f"{setting_name} must be an HTTPS URL.",
        )


def _fetch_callback_public_key() -> str:
    app_name = os.getenv("AZAMPAY_APP_NAME")
    client_id = os.getenv("AZAMPAY_CLIENT_ID")
    client_secret = os.getenv("AZAMPAY_CLIENT_SECRET")
    if not all((app_name, client_id, client_secret)):
        raise HTTPException(
            status_code=500,
            detail="AzamPay checkout credentials are not configured for callback verification.",
        )

    auth_url = os.getenv(
        "AZAMPAY_AUTH_URL",
        "https://authenticator.azampay.co.tz/AppRegistration/GenerateToken",
    )
    _validate_https_url(auth_url, "AzamPay authentication URL")
    try:
        auth_response = requests.post(
            auth_url,
            json={
                "appName": app_name,
                "clientId": client_id,
                "clientSecret": client_secret,
            },
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=10,
        )
    except requests.exceptions.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to AzamPay authentication to verify its callback key.",
        ) from error

    if auth_response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=(
                "AzamPay authentication failed while retrieving the callback key "
                f"(HTTP {auth_response.status_code})."
            ),
        )

    auth_body = _response_body(auth_response)
    token = None
    if isinstance(auth_body, dict):
        token = auth_body.get("token") or auth_body.get("accessToken")
        data = auth_body.get("data")
        if isinstance(data, dict):
            token = token or data.get("token") or data.get("accessToken")
    if not token:
        raise HTTPException(
            status_code=502,
            detail="AzamPay authentication returned no token for callback verification.",
        )

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    }
    api_key = os.getenv("AZAMPAY_API_KEY", os.getenv("AZAMPAY_TOKEN"))
    if api_key:
        headers["X-API-Key"] = api_key

    try:
        key_response = requests.get(
            _callback_public_key_url(),
            headers=headers,
            timeout=10,
        )
    except requests.exceptions.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve AzamPay's Checkout callback public key.",
        ) from error

    if not key_response.ok:
        raise HTTPException(
            status_code=502,
            detail=(
                "AzamPay rejected the callback public-key request "
                f"(HTTP {key_response.status_code})."
            ),
        )

    key_body = _response_body(key_response)
    public_key_pem = None
    if isinstance(key_body, dict):
        public_key_pem = key_body.get("publicKey") or key_body.get("public_key")
        data = key_body.get("data")
        if isinstance(data, dict):
            public_key_pem = public_key_pem or data.get("publicKey") or data.get("public_key")
    if not isinstance(public_key_pem, str) or not public_key_pem.strip():
        raise HTTPException(
            status_code=502,
            detail="AzamPay callback public-key response did not contain a PEM key.",
        )

    try:
        public_key = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="AzamPay returned an invalid callback public key.",
        ) from error
    if not isinstance(public_key, RSAPublicKey):
        raise HTTPException(
            status_code=502,
            detail="AzamPay callback public key is not an RSA key.",
        )

    return public_key_pem


def get_callback_public_key(*, force_refresh: bool = False) -> str:
    global _callback_key_cache
    with _callback_key_lock:
        now = time.monotonic()
        if (
            not force_refresh
            and _callback_key_cache is not None
            and now - _callback_key_cache[0] < _CALLBACK_KEY_CACHE_SECONDS
        ):
            return _callback_key_cache[1]

        public_key_pem = _fetch_callback_public_key()
        _callback_key_cache = (now, public_key_pem)
        return public_key_pem
