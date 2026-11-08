import os
from pathlib import Path
from typing import Any, Dict
from urllib.parse import quote, urlsplit

import requests
from dotenv import load_dotenv

from models.tplink import TplinkAuthorizeRequest

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class OmadaConfigurationError(RuntimeError):
    pass


class OmadaControllerError(RuntimeError):
    pass


class OmadaService:
    @staticmethod
    def _error_message(payload: Any) -> str:
        if isinstance(payload, dict):
            return str(
                payload.get("msg")
                or payload.get("message")
                or payload.get("error")
                or payload.get("errorCode")
                or "Unknown Omada API error."
            )
        return "Omada returned an invalid response."

    def authorize_client(
        self,
        portal: TplinkAuthorizeRequest,
        expiration_time_microseconds: int,
    ) -> None:
        base_url = os.getenv("OMADA_BASE_URL", "").strip().rstrip("/")
        controller_id = os.getenv("OMADA_CONTROLLER_ID", "").strip()
        username = os.getenv("OMADA_OPERATOR_USERNAME", "").strip()
        password = os.getenv("OMADA_OPERATOR_PASSWORD", "")

        if not all((base_url, controller_id, username, password)):
            raise OmadaConfigurationError(
                "Configure OMADA_BASE_URL, OMADA_CONTROLLER_ID, "
                "OMADA_OPERATOR_USERNAME, and OMADA_OPERATOR_PASSWORD."
            )

        parsed_url = urlsplit(base_url)
        if (
            parsed_url.scheme not in {"http", "https"}
            or not parsed_url.netloc
            or parsed_url.path not in {"", "/"}
            or parsed_url.query
            or parsed_url.fragment
        ):
            raise OmadaConfigurationError(
                "OMADA_BASE_URL must be an absolute controller URL, such as https://controller.example:8043."
            )

        try:
            timeout = float(os.getenv("OMADA_REQUEST_TIMEOUT", "10"))
        except ValueError as exc:
            raise OmadaConfigurationError(
                "OMADA_REQUEST_TIMEOUT must be a positive number."
            ) from exc
        if timeout <= 0:
            raise OmadaConfigurationError(
                "OMADA_REQUEST_TIMEOUT must be a positive number."
            )

        verify_tls = (
            os.getenv("OMADA_VERIFY_TLS", "true").strip().lower()
            not in {"0", "false", "no", "off"}
        )
        api_base = f"{base_url}/{quote(controller_id, safe='')}/api/v2/hotspot"
        login_url = f"{api_base}/login"
        authorize_url = f"{api_base}/extPortal/auth"

        session = requests.Session()
        try:
            try:
                login_response = session.post(
                    login_url,
                    json={"name": username, "password": password},
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    timeout=timeout,
                    verify=verify_tls,
                )
                login_response.raise_for_status()
                login_data = login_response.json()
            except (requests.RequestException, ValueError) as exc:
                raise OmadaControllerError(
                    "Could not log in to the Omada Controller."
                ) from exc

            if not isinstance(login_data, dict) or str(login_data.get("errorCode")) != "0":
                raise OmadaControllerError(
                    f"Omada operator login failed: {self._error_message(login_data)}"
                )

            login_result = login_data.get("result")
            csrf_token = (
                login_result.get("token")
                if isinstance(login_result, dict)
                else None
            )
            if not csrf_token:
                raise OmadaControllerError(
                    "Omada login succeeded without returning a CSRF token."
                )

            payload: Dict[str, Any] = {
                "clientMac": portal.buyer_mac,
                "apMac": portal.ap_mac,
                "ssidName": portal.ssid_name,
                "radioId": portal.radio_id,
                "site": portal.site,
                "time": expiration_time_microseconds,
                "authType": 4,
            }

            try:
                response = session.post(
                    authorize_url,
                    json=payload,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Csrf-Token": csrf_token,
                    },
                    timeout=timeout,
                    verify=verify_tls,
                )
                response.raise_for_status()
                authorization_data = response.json()
            except (requests.RequestException, ValueError) as exc:
                raise OmadaControllerError(
                    "Could not authorize the client through the Omada Controller."
                ) from exc

            if (
                not isinstance(authorization_data, dict)
                or str(authorization_data.get("errorCode")) != "0"
            ):
                raise OmadaControllerError(
                    f"Omada rejected client authorization: {self._error_message(authorization_data)}"
                )
        finally:
            session.close()
