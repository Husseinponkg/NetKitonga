import os

from services.payments import PaymentService


def test_default_auth_url_uses_authenticator_host(monkeypatch):
    monkeypatch.delenv("AZAMPAY_AUTH_URL", raising=False)
    monkeypatch.delenv("AZAMPAY_SANDBOX_AUTH_URL", raising=False)
    monkeypatch.setenv("AZAMPAY_APP_NAME", "Netkitonga")
    monkeypatch.setenv("AZAMPAY_CLIENT_ID", "client-id")
    monkeypatch.setenv("AZAMPAY_CLIENT_SECRET", "client-secret")
    monkeypatch.setenv("AZAMPAY_TOKEN", "api-key")

    service = PaymentService()

    assert service.auth_url == "https://authenticator-sandbox.azampay.co.tz/AppRegistration/GenerateToken"
