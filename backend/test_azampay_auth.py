import os
import requests
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

checkout_base_url = os.getenv(
    "AZAMPAY_CHECKOUT_BASE_URL",
    os.getenv(
        "AZAMPAY_SANDBOX_CHECKOUT_BASE_URL",
        os.getenv("Azampay_Sandbox_Checkout_Base_Url", "https://sandbox.azampay.co.tz"),
    ),
).rstrip("/")
url = os.getenv(
    "AZAMPAY_AUTH_URL",
    os.getenv(
        "AZAMPAY_SANDBOX_AUTH_URL",
        "https://authenticator-sandbox.azampay.co.tz/AppRegistration/GenerateToken",
    ),
)

payload = {
    "appName": os.getenv("AZAMPAY_APP_NAME", "appName"),
    "clientId": os.getenv("AZAMPAY_CLIENT_ID", "clientId"),
    "clientSecret": os.getenv("AZAMPAY_CLIENT_SECRET", "clientSecret"),
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers, timeout=20)
print("STATUS:", response.status_code)
print(response.text)
