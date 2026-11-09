import os
import time
from pathlib import Path
from typing import Any, Dict
from urllib.parse import quote, urlsplit

import requests
from dotenv import load_dotenv

from models.tplink import TplinkAuthorizeRequest
from utils.mac import normalize_mac

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DEAUTHORIZATION_TIMEOUT_SECONDS = 20


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

    @staticmethod
    def _configuration() -> tuple[str, str, str, str, float, bool]:
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
        return base_url, controller_id, username, password, timeout, verify_tls

    def authorize_client(
        self,
        portal: TplinkAuthorizeRequest,
        duration_milliseconds: int,
    ) -> None:
        duration_started = time.monotonic()
        (
            base_url,
            controller_id,
            username,
            password,
            timeout,
            verify_tls,
        ) = self._configuration()
        api_base = f"{base_url}/{quote(controller_id, safe='')}/api/v2/hotspot"
        login_url = f"{api_base}/login"
        authorize_url = f"{api_base}/extPortal/auth"

        session = requests.Session()
        try:
            csrf_token = self._login(
                session,
                login_url,
                username,
                password,
                timeout,
                verify_tls,
            )

            remaining_milliseconds = int(
                duration_milliseconds
                - (time.monotonic() - duration_started) * 1000
            )
            if remaining_milliseconds <= 0:
                raise OmadaControllerError(
                    "The paid session expired before Omada authorization completed."
                )

            payload: Dict[str, Any] = {
                "clientMac": portal.buyer_mac,
                "apMac": portal.ap_mac,
                "ssidName": portal.ssid_name,
                "radioId": portal.radio_id,
                "site": portal.site,
                "time": remaining_milliseconds,
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

    def deauthorize_client(
        self,
        client_mac: str,
        site: str,
        ssid_name: str,
    ) -> None:
        (
            base_url,
            controller_id,
            username,
            password,
            timeout,
            verify_tls,
        ) = self._configuration()
        api_base = f"{base_url}/{quote(controller_id, safe='')}/api/v2/hotspot"
        deadline = time.monotonic() + DEAUTHORIZATION_TIMEOUT_SECONDS

        session = requests.Session()
        try:
            csrf_token = self._login(
                session,
                f"{api_base}/login",
                username,
                password,
                self._remaining_timeout(deadline, timeout),
                verify_tls,
            )

            clients_url = (
                f"{api_base}/sites/{quote(site, safe='')}/clients"
            )
            matching_clients = [
                client
                for client in self._hotspot_clients(
                    session,
                    clients_url,
                    csrf_token,
                    timeout,
                    verify_tls,
                    deadline,
                )
                if self._matches_grant(client, client_mac, ssid_name)
            ]

            if not matching_clients:
                return
            if len(matching_clients) != 1:
                raise OmadaControllerError(
                    "Cannot uniquely identify the active Omada client to disconnect."
                )

            client_id = matching_clients[0].get("id")
            if isinstance(client_id, bool) or not isinstance(
                client_id, (str, int)
            ) or not str(client_id):
                raise OmadaControllerError(
                    "Omada returned an invalid Hotspot Manager client identifier."
                )

            disconnect_url = (
                f"{api_base}/sites/{quote(site, safe='')}/cmd/clients/"
                f"{quote(str(client_id), safe='')}/disconnect"
            )
            try:
                response = session.post(
                    disconnect_url,
                    headers={"Accept": "application/json", "Csrf-Token": csrf_token},
                    timeout=self._remaining_timeout(deadline, timeout),
                    verify=verify_tls,
                )
                response.raise_for_status()
                disconnect_data = response.json()
            except (requests.RequestException, ValueError) as exc:
                raise OmadaControllerError(
                    "Could not disconnect the client through Omada."
                ) from exc

            if (
                not isinstance(disconnect_data, dict)
                or str(disconnect_data.get("errorCode")) != "0"
            ):
                raise OmadaControllerError(
                    f"Omada rejected client disconnection: {self._error_message(disconnect_data)}"
                )

            for _ in range(3):
                time.sleep(min(0.25, self._remaining_timeout(deadline, timeout)))
                remaining_clients = self._hotspot_clients(
                    session,
                    clients_url,
                    csrf_token,
                    timeout,
                    verify_tls,
                    deadline,
                )
                if not any(
                    self._matches_grant(client, client_mac, ssid_name)
                    for client in remaining_clients
                ):
                    return
            raise OmadaControllerError(
                "Omada accepted client disconnection but still reports an active grant."
            )
        finally:
            session.close()

    @staticmethod
    def _hotspot_clients(
        session: requests.Session,
        clients_url: str,
        csrf_token: str,
        timeout: float,
        verify_tls: bool,
        deadline: float,
    ) -> list[Dict[str, Any]]:
        rows: list[Dict[str, Any]] = []
        seen_ids: set[str] = set()
        expected_total = None
        for page in range(1, 101):
            request_timeout = OmadaService._remaining_timeout(deadline, timeout)
            try:
                response = session.get(
                    clients_url,
                    params={"currentPage": page, "currentPageSize": 100},
                    headers={"Accept": "application/json", "Csrf-Token": csrf_token},
                    timeout=request_timeout,
                    verify=verify_tls,
                )
                response.raise_for_status()
                client_data = response.json()
            except (requests.RequestException, ValueError) as exc:
                raise OmadaControllerError(
                    "Could not read Omada Hotspot Manager clients."
                ) from exc

            if (
                not isinstance(client_data, dict)
                or str(client_data.get("errorCode")) != "0"
            ):
                raise OmadaControllerError(
                    "Omada returned an invalid Hotspot Manager client list."
                )

            result = client_data.get("result")
            if not isinstance(result, dict) or not isinstance(
                result.get("data"), list
            ):
                raise OmadaControllerError(
                    "Omada returned an invalid Hotspot Manager client list."
                )

            total = result.get("totalRows")
            batch = result["data"]
            if (
                type(total) is not int
                or total < 0
                or total > 10000
                or (expected_total is not None and total != expected_total)
                or len(rows) + len(batch) > total
            ):
                raise OmadaControllerError(
                    "Omada returned an invalid Hotspot Manager client count."
                )
            expected_total = total

            for client in batch:
                if (
                    not isinstance(client, dict)
                    or isinstance(client.get("id"), bool)
                    or not isinstance(client.get("id"), (str, int))
                    or not str(client["id"])
                    or type(client.get("valid")) is not bool
                ):
                    raise OmadaControllerError(
                        "Omada returned an invalid Hotspot Manager client record."
                    )
                client_id = str(client["id"])
                if client_id in seen_ids:
                    raise OmadaControllerError(
                        "Omada returned duplicate Hotspot Manager client records."
                    )
                seen_ids.add(client_id)
                rows.append(client)

            if len(rows) == total:
                return rows
            if not batch:
                raise OmadaControllerError(
                    "Omada returned an incomplete Hotspot Manager client list."
                )
        raise OmadaControllerError(
            "Omada Hotspot Manager client list exceeded the page limit."
        )

    @staticmethod
    def _remaining_timeout(deadline: float, request_timeout: float) -> float:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise OmadaControllerError(
                "Omada client disconnection exceeded the 20-second time limit. "
                "The saved context is retained; retry termination or disconnect "
                "the client manually in Hotspot Manager."
            )
        return min(request_timeout, remaining)

    @staticmethod
    def _matches_grant(
        client: Dict[str, Any],
        client_mac: str,
        ssid_name: str,
    ) -> bool:
        return (
            client.get("valid") is True
            and client.get("authType") == 4
            and normalize_mac(str(client.get("mac", "")))
            == normalize_mac(client_mac)
            and client.get("ssid") == ssid_name
        )

    @staticmethod
    def _login(
        session: requests.Session,
        login_url: str,
        username: str,
        password: str,
        timeout: float,
        verify_tls: bool,
    ) -> str:
        try:
            response = session.post(
                login_url,
                json={"name": username, "password": password},
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=timeout,
                verify=verify_tls,
            )
            response.raise_for_status()
            login_data = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise OmadaControllerError(
                "Could not log in to the Omada Controller."
            ) from exc

        if not isinstance(login_data, dict) or str(login_data.get("errorCode")) != "0":
            raise OmadaControllerError(
                f"Omada operator login failed: {OmadaService._error_message(login_data)}"
            )

        login_result = login_data.get("result")
        csrf_token = (
            login_result.get("token")
            if isinstance(login_result, dict)
            else None
        )
        if not isinstance(csrf_token, str) or not csrf_token:
            raise OmadaControllerError(
                "Omada login succeeded without returning a CSRF token."
            )
        return csrf_token
