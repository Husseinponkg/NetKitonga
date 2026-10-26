
import os
from typing import Dict, Any, Optional
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class TplinkService:

    @staticmethod
    def build_config(
        device_name: str,
        ip_address: str,
        nas_identifier: str,
        radius_secret: str,
        portal_url: str,
        router_id: Optional[int] = None,
        tenant_id: Optional[int] = None,
        branch_id: Optional[int] = None,
        ssid: Optional[str] = None,
    ) -> Dict[str, Any]:

        # ---------------------------------------------------------
        # VALIDATE SSID
        # Each TP-Link device must have its own configured SSID.
        # Do not hardcode one SSID for all registered routers.
        # ---------------------------------------------------------
        if not ssid or not ssid.strip():
            raise ValueError(
                "SSID is required. Configure the SSID for this TP-Link device."
            )

        ssid = ssid.strip()

        # ---------------------------------------------------------
        # VALIDATE RADIUS SECRET
        # ---------------------------------------------------------
        if not radius_secret or not radius_secret.strip():
            raise ValueError(
                "A non-empty RADIUS shared secret is required for TP-Link."
            )

        # ---------------------------------------------------------
        # SYSTEM DOMAIN AND SERVER IP
        # ---------------------------------------------------------
        configured_domain = (
            os.getenv("SYSTEM_DOMAIN")
            or os.getenv("SYSTEM_SERVER_IP")
            or ""
        )

        system_domain = (
            configured_domain
            .removeprefix("https://")
            .removeprefix("http://")
            .rstrip("/")
        )

        configured_server_ip = os.getenv("SYSTEM_SERVER_IP") or ""

        system_ip = (
            configured_server_ip
            .removeprefix("https://")
            .removeprefix("http://")
            .rstrip("/")
        )

        if not system_ip or system_ip in {"0.0.0.0", "localhost"}:
            raise ValueError(
                "Set SYSTEM_SERVER_IP to the reachable server address "
                "used by TP-Link to contact FreeRADIUS."
            )

        # ---------------------------------------------------------
        # PORTAL URL
        # ---------------------------------------------------------
        base_portal_url = (
            portal_url.strip()
            if portal_url and portal_url.strip()
            else (
                f"https://{system_domain}/portal"
                if system_domain
                else ""
            )
        )

        if not base_portal_url:
            raise ValueError(
                "Set SYSTEM_DOMAIN or provide an absolute portal_url."
            )

        parts = urlsplit(base_portal_url)

        if parts.scheme not in {"http", "https"} or not parts.netloc:
            raise ValueError(
                "portal_url must be an absolute http:// or https:// URL."
            )

        # ---------------------------------------------------------
        # PORTAL QUERY PARAMETERS
        # Preserve existing parameters and add NetKitonga identifiers.
        # ---------------------------------------------------------
        query = dict(
            parse_qsl(parts.query, keep_blank_values=True)
        )

        query["portal_type"] = "tplink"

        if router_id is not None:
            query["router_id"] = str(router_id)

        if tenant_id is not None:
            query["tenant_id"] = str(tenant_id)

        if branch_id is not None:
            query["branch_id"] = str(branch_id)

        external_portal_url = urlunsplit(
            (
                parts.scheme,
                parts.netloc,
                parts.path or "/portal",
                urlencode(query),
                parts.fragment,
            )
        )

        # ---------------------------------------------------------
        # TP-LINK CONFIGURATION
        # ---------------------------------------------------------
        return {
            "ssid": ssid,
            "authentication_type": "External RADIUS Server",
            "radius_server_ip": system_ip,
            "radius_port": 1812,
            "radius_password": radius_secret,
            "nas_id": (
                nas_identifier.strip()
                if nas_identifier and nas_identifier.strip()
                else device_name.strip()
            ),
            "external_portal_url": external_portal_url,
            "device_name": device_name,
            "device_ip": ip_address,
            "router_id": router_id,
            "tenant_id": tenant_id,
            "branch_id": branch_id,
        }
