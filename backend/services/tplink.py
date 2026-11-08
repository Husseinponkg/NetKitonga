
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
        portal_url: str,
        router_id: Optional[int] = None,
        tenant_id: Optional[int] = None,
        branch_id: Optional[int] = None,
    ) -> Dict[str, Any]:
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

        return {
            "authentication_type": "External Portal Server",
            "external_portal_url": external_portal_url,
            "device_name": device_name,
            "device_ip": ip_address,
            "router_id": router_id,
            "tenant_id": tenant_id,
            "branch_id": branch_id,
        }
