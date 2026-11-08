import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from models.tplink import TplinkAuthorizeRequest
from services.omada import (
    OmadaConfigurationError,
    OmadaControllerError,
    OmadaService,
)


class OmadaServiceTests(unittest.TestCase):
    def setUp(self):
        self.portal = TplinkAuthorizeRequest(
            router_id=15,
            buyerMac="AA-BB-CC-DD-EE-FF",
            auth_token="paid-session-token",
            apMac="10-5A-95-51-D4-E4",
            ssidName="Guest WiFi",
            radioId=1,
            site="Rchuganet",
            t="1730000000000000",
            redirectUrl="https://example.com/",
        )
        self.login_response = MagicMock()
        self.login_response.json.return_value = {
            "errorCode": 0,
            "result": {"token": "csrf-token"},
        }
        self.login_response.raise_for_status.return_value = None
        self.authorization_response = MagicMock()
        self.authorization_response.json.return_value = {"errorCode": 0}
        self.authorization_response.raise_for_status.return_value = None
        self.session = MagicMock()
        self.session.post.side_effect = [
            self.login_response,
            self.authorization_response,
        ]

    @patch.dict("os.environ", {}, clear=True)
    @patch("services.omada.requests.Session")
    def test_requires_controller_credentials_from_backend_environment(
        self,
        session_factory,
    ):
        with self.assertRaises(OmadaConfigurationError):
            OmadaService().authorize_client(
                self.portal,
                1_730_000_000_000_000,
            )

        session_factory.assert_not_called()

    @patch.dict(
        "os.environ",
        {
            "OMADA_BASE_URL": "https://controller.example:8043",
            "OMADA_CONTROLLER_ID": "controller-id",
            "OMADA_OPERATOR_USERNAME": "portal-operator",
            "OMADA_OPERATOR_PASSWORD": "operator-secret",
        },
        clear=False,
    )
    @patch("services.omada.requests.Session")
    def test_login_then_authorize_uses_cookie_csrf_and_expiration_timestamp(
        self,
        session_factory,
    ):
        session_factory.return_value = self.session

        OmadaService().authorize_client(self.portal, 1_730_000_000_000_000)

        self.assertEqual(self.session.post.call_count, 2)
        login_call, auth_call = self.session.post.call_args_list
        self.assertEqual(
            login_call.args[0],
            "https://controller.example:8043/controller-id/api/v2/hotspot/login",
        )
        self.assertEqual(
            login_call.kwargs["json"],
            {"name": "portal-operator", "password": "operator-secret"},
        )
        self.assertEqual(
            auth_call.args[0],
            "https://controller.example:8043/controller-id/api/v2/hotspot/extPortal/auth",
        )
        self.assertEqual(auth_call.kwargs["headers"]["Csrf-Token"], "csrf-token")
        self.assertEqual(
            auth_call.kwargs["json"],
            {
                "clientMac": "AA-BB-CC-DD-EE-FF",
                "apMac": "10-5A-95-51-D4-E4",
                "ssidName": "Guest WiFi",
                "radioId": 1,
                "site": "Rchuganet",
                "time": 1_730_000_000_000_000,
                "authType": 4,
            },
        )
        self.session.close.assert_called_once()

    @patch.dict(
        "os.environ",
        {
            "OMADA_BASE_URL": "https://controller.example:8043",
            "OMADA_CONTROLLER_ID": "controller-id",
            "OMADA_OPERATOR_USERNAME": "portal-operator",
            "OMADA_OPERATOR_PASSWORD": "operator-secret",
        },
        clear=False,
    )
    @patch("services.omada.requests.Session")
    def test_rejects_controller_login_failure(self, session_factory):
        failed_login = MagicMock()
        failed_login.raise_for_status.return_value = None
        failed_login.json.return_value = {
            "errorCode": -1,
            "msg": "Invalid operator credentials",
        }
        self.session.post.side_effect = None
        self.session.post.return_value = failed_login
        session_factory.return_value = self.session

        with self.assertRaisesRegex(
            OmadaControllerError, "Omada operator login failed"
        ):
            OmadaService().authorize_client(
                self.portal,
                1_730_000_000_000_000,
            )

        self.assertEqual(self.session.post.call_count, 1)
        self.session.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
