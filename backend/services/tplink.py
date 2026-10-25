
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
    ) -> Dict[str, Any]:

        configured_domain = (
            os.getenv("SYSTEM_DOMAIN")
            or os.getenv("SYSTEM_SERVER_IP")
            or "0.0.0.0"
        )

        system_domain = (
            configured_domain
            .removeprefix("https://")
            .removeprefix("http://")
            .rstrip("/")
        )

        system_ip = (
            os.getenv("SYSTEM_SERVER_IP") or system_domain
        ).removeprefix("https://").removeprefix("http://").rstrip("/")

        # Build the TP-Link-specific portal URL.
        base_portal_url = (
            portal_url.strip()
            if portal_url and portal_url.strip()
            else f"https://{system_domain}/portal"
        )

        parts = urlsplit(base_portal_url)

        # Preserve existing query parameters and add/update the
        # identifiers required by the NetKitonga portal.
        query = dict(parse_qsl(parts.query, keep_blank_values=True))

        if router_id is not None:
            query["router_id"] = str(router_id)

        if tenant_id is not None:
            query["tenant_id"] = str(tenant_id)

        if branch_id is not None:
            query["branch_id"] = str(branch_id)

        external_portal_url = urlunsplit((
            parts.scheme,
            parts.netloc,
            parts.path or "/portal",
            urlencode(query),
            parts.fragment,
        ))

        return {
            "ssid": "noma",
            "authentication_type": "External RADIUS Server",
            "radius_server_ip": system_ip,
            "radius_port": 1812,
            "radius_password": radius_secret,
            "nas_id": nas_identifier or device_name,
            "external_portal_url": external_portal_url,
            "device_name": device_name,
            "device_ip": ip_address,
            "router_id": router_id,
        }
