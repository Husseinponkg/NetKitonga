import os
from typing import Optional, Dict, Any
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
import os

class RouterService:
    async def router_connection(
        self,
        tenant_id: int,
        branch_id: int,
        router_name: str,
        driver_type: str,                # 'radius_aaa' or 'wifidog_http'
        nas_identifier: Optional[str],
        radius_secret: Optional[str],
        gw_id: Optional[str],
        mac_address: str,
        is_licensed: bool,
        status: str,
        last_heartbeat_at: Optional[datetime]
    ) -> Dict[str, Any]:
        """
        Builds the target tracking payload and automatically generates zero-configuration
        setup parameters so the tenant can copy-paste straight into their device.
        """
        # Pull your central server values directly from the environment variables
        system_domain = os.getenv("SYSTEM_DOMAIN") or os.getenv("SYSTEM_SERVER_IP")
        if not system_domain:
            raise ValueError("SYSTEM_SERVER_IP or SYSTEM_DOMAIN must be configured")
        system_ip = os.getenv("SYSTEM_SERVER_IP") or system_domain
        
        # 1. Standard structural database payload mapping
        router_payload = {
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "router_name": router_name,
            "driver_type": driver_type,
            "nas_identifier": nas_identifier if driver_type == 'radius_aaa' else None,
            "radius_secret": radius_secret if driver_type == 'radius_aaa' else None,
            "gw_id": gw_id if driver_type == 'wifidog_http' else None,
            "mac_address": mac_address,
            "is_licensed": is_licensed,
            "status": status,
            "last_heartbeat_at": last_heartbeat_at.isoformat() if last_heartbeat_at else None
        }

        # 2. AUTOMATED SCRIPT GENERATION FOR MIKROTIK (RADIUS AAA PATH)
        if driver_type == "radius_aaa" or driver_type == "mikrotik_radius":
            api_url = f"http://{system_domain}:8000/routers/mikrotik/ping"
            
            # Generate a 100% automated copy-paste terminal script for MikroTik WinBox
            automated_script = (
                f"/radius remove [find]; "
                f"/radius add service=hotspot address={system_ip} secret=\"{radius_secret}\" authentication-port=1812 accounting-port=1813; "
                f"/ip hotspot profile add name=SmartNetProfile hotspot-address=10.10.10.1 login-by=http-chap,cookie split-user-domain=no; "
                f"/ip hotspot profile set SmartNetProfile use-radius=yes radius-interim-update=00:02:00; "
                f"/ip hotspot add name=\"Hotspot_{branch_id}\" interface=ether2 profile=SmartNetProfile disabled=no; "
                f"/ip firewall mangle add chain=postrouting out-interface=ether1 action=change-ttl new-ttl=set:1 comment=\"Anti-Hotspot-Sharing\"; "
                f"/system script remove [find name=\"CloudPing\"]; "
                f"/system scheduler remove [find name=\"Run_CloudPing\"]; "
                f"/system script add name=\"CloudPing\" source={{ /tool fetch url=\"{api_url}?nas_id={nas_identifier}\" mode=http keep-result=no }}; "
                f"/system scheduler add name=\"Run_CloudPing\" interval=1m start-time=startup on-event=\"/system script run CloudPing\"; "
                f"/system script run CloudPing;"
            )
            
            return {
                "url": api_url,
                "router": router_payload,
                "provision_method": "Paste into MikroTik Terminal",
                "hardware_config_block": automated_script
            }

        # 3. AUTOMATED PARAMETERS FOR RUIJIE / OPENWRT / TP-LINK (WIFIDOG HTTP PATH)
        elif driver_type == "wifidog_http" or driver_type == "ruijie_wifidog":
            api_url = f"http://{system_domain}:8000/routers/wifidog/ping"
            
            return {
                "url": api_url,
                "router": router_payload,
                "provision_method": "Enter into Router Wifidog Settings Fields",
                "hardware_config_block": {
                    "Gateway ID (gw_id)": gw_id,
                    "Auth Server Host": system_domain,
                    "Auth Server Port": 80,
                    "Auth Server Path": "/api/wifidog/"
                }
            }

        # 4. Fallback Protection
        else:
            return {
                "url": "unknown_api_url",
                "router": router_payload,
                "provision_method": "Unknown",
                "hardware_config_block": None
            }
