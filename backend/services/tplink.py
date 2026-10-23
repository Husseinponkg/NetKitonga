import os
from typing import Dict, Any
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class TplinkService:
    @staticmethod
    def build_config(device_name: str, ip_address: str, nas_identifier: str, radius_secret: str, portal_url: str, router_id: int = None) -> Dict[str, Any]:
        configured_domain = (
            os.getenv("SYSTEM_DOMAIN")
            or os.getenv("SYSTEM_SERVER_IP")
            or "0.0.0.0"
        )
        system_domain = configured_domain.removeprefix("https://").removeprefix("http://").rstrip("/")
        system_ip = (os.getenv("SYSTEM_SERVER_IP") or system_domain).removeprefix("https://").removeprefix("http://").rstrip("/")

        return {
            "ssid": "noma",
            "authentication_type": "External RADIUS Server",
            "radius_server_ip": system_ip,
            "radius_port": 1812,
            "radius_password": radius_secret,
            "nas_id": nas_identifier or device_name,
            "external_portal_url": (portal_url or f"http://{system_domain}/portal") + (f"?router_id={router_id}" if router_id and "router_id" not in (portal_url or "") else ""),
            "device_name": device_name,
            "device_ip": ip_address,
            "router_id": router_id,
        }
