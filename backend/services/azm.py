import requests

url = "https://authenticator-sandbox.azampay.co.tz/AppRegistration/GenerateToken"

payload = {
    "appName": "appName",
    "clientId": "clientId",
    "clientSecret": "clientSecret"
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)

print(response.text)

https://authenticator-sandbox.azampay.co.tz
/AppRegistration/GenerateToken
import requests

url = "https://sandbox.azampay.co.tz/azampay/mno/checkout"

payload = {
    "accountNumber": "accountNumber",
    "additionalProperties": { "key": {} },
    "amount": 0,
    "currency": "currency",
    "externalId": "externalId",
    "provider": "Airtel"
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)

print(response.text)

https://sandbox.azampay.co.tz
/azampay/mno/checkout

externalId​string · required
Maximum length: 128 characters.

provider​string · enum · required
Enum values:
Airtel
Tigo
Halopesa
Azampesa
Mpesa

currency=tzs