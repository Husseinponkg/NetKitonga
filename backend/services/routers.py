import os
from typing import Optional, Dict, Any, List
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
from config.db import connection

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from services.freeradius import FreeRADIUSService

freeradius_service = FreeRADIUSService()


class RouterService:

    @staticmethod
    def get_router_ip_candidates(ip_address: str) -> List[str]:
        """
        Build possible router IP addresses from a MikroTik value.

        MikroTik may send:
            10.10.10.1
            10.10.10.1:80

        PostgreSQL inet requires only the IP address,
        so remove the port before querying the database.
        """

        candidates: List[str] = []

        cleaned = str(ip_address or "").strip()

        if not cleaned:
            return candidates

        # Remove protocol if it is accidentally included.
        cleaned = cleaned.replace("http://", "").replace("https://", "")

        # MikroTik can send the gateway as:
        # 10.10.10.1:80
        #
        # PostgreSQL inet accepts:
        # 10.10.10.1
        #
        # Therefore remove the port.
        if ":" in cleaned and cleaned.count(":") == 1:
            cleaned = cleaned.split(":", 1)[0]

        seen = set()

        # First try the cleaned/original IP.
        if cleaned not in seen:
            candidates.append(cleaned)
            seen.add(cleaned)

        # If the supplied IP is IPv4, also try the
        # common gateway address ending in .1.
        parts = cleaned.split(".")

        if len(parts) == 4:
            gateway_candidate = ".".join(parts[:3] + ["1"])

            if gateway_candidate not in seen:
                candidates.append(gateway_candidate)
                seen.add(gateway_candidate)

        return candidates

    async def get_router_by_ip(self, ip_address: str) -> Optional[dict]:
        conn = await connection()

        try:
            async with conn.cursor() as cursor:

                for candidate in self.get_router_ip_candidates(ip_address):

                    await cursor.execute(
                        """
                        SELECT id, tenant_id, branch_id
                        FROM routers
                        WHERE ip_address = %s;
                        """,
                        (str(candidate),)
                    )

                    row = await cursor.fetchone()

                    if row:
                        return {
                            "id": row[0],
                            "tenant_id": row[1],
                            "branch_id": row[2]
                        }

                return None

        finally:
            await conn.close()

    async def get_router_by_nas_identifier(
        self,
        nas_identifier: str
    ) -> Optional[dict]:

        conn = await connection()

        try:
            async with conn.cursor() as cursor:

                await cursor.execute(
                    """
                    SELECT id, tenant_id, branch_id
                    FROM routers
                    WHERE nas_identifier = %s
                      AND driver_type = 'mikrotik_radius';
                    """,
                    (nas_identifier.strip(),)
                )

                row = await cursor.fetchone()

                if row:
                    return {
                        "id": row[0],
                        "tenant_id": row[1],
                        "branch_id": row[2]
                    }

                return None

        finally:
            await conn.close()

    async def router_connection(
        self,
        tenant_id: int,
        branch_id: int,
        router_name: str,
        driver_type: str,
        nas_identifier: Optional[str],
        radius_secret: Optional[str],
        gw_id: Optional[str],
        mac_address: str,
        ip_address: object,
        is_licensed: bool,
        status: str,
        last_heartbeat_at: Optional[datetime],
        router_id: Optional[int] = None
    ) -> Dict[str, Any]:

        """
        Builds the target tracking payload and automatically generates
        zero-configuration setup parameters so the tenant can copy-paste
        straight into their device.
        """

        # ---------------------------------------------------------
        # CENTRAL SERVER CONFIGURATION
        # ---------------------------------------------------------

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

        configured_system_ip = (
            os.getenv("SYSTEM_SERVER_IP")
            or system_domain
        )

        system_ip = (
            configured_system_ip
            .removeprefix("https://")
            .removeprefix("http://")
            .rstrip("/")
        )

        api_scheme = (
            "https"
            if configured_domain.startswith("https://")
            else "http"
        )

        api_port = "" if api_scheme == "https" else ":8000"

        fetch_mode = (
            "https"
            if api_scheme == "https"
            else "http"
        )

        frontend_url = (
            os.getenv("FRONTEND_URL")
            or "https://netkitonga.com"
        ).rstrip("/")

        # ---------------------------------------------------------
        # DATABASE PAYLOAD
        # ---------------------------------------------------------

        router_payload = {
            "tenant_id": tenant_id,
            "branch_id": branch_id,
            "router_name": router_name,
            "driver_type": driver_type,
            "nas_identifier": (
                nas_identifier
                if driver_type == "mikrotik_radius"
                else None
            ),
            "radius_secret": (
                radius_secret
                if driver_type == "mikrotik_radius"
                else None
            ),
            "gw_id": (
                gw_id
                if driver_type == "wifidog_http"
                else None
            ),
            "mac_address": mac_address,
            "ip_address": str(ip_address),
            "is_licensed": is_licensed,
            "status": status,
            "last_heartbeat_at": (
                last_heartbeat_at.isoformat()
                if last_heartbeat_at
                else None
            )
        }

        # ---------------------------------------------------------
        # MIKROTIK / RADIUS AAA
        # ---------------------------------------------------------

        if driver_type == "radius_aaa" or driver_type == "mikrotik_radius":

            api_url = (
                f"{api_scheme}://"
                f"{system_domain}"
                f"{api_port}"
                f"/routers/mikrotik/ping"
            )

            portal_redirect_url = (
                f"{frontend_url}/portal"
                f"?router_id={router_id or ''}"
            )

            heartbeat_url = (
                f"{api_url}?nas_id={nas_identifier}"
            )

            automated_script = (
                f"/radius remove [find];\n"

                f"/radius add "
                f"service=hotspot "
                f"address={system_ip} "
                f"secret=\"{radius_secret}\" "
                f"authentication-port=1812 "
                f"accounting-port=1813;\n"

                f"/ip hotspot profile add "
                f"name=SmartNetProfile "
                f"hotspot-address=10.10.10.1 "
                f"login-by=http-chap,http-pap,cookie "
                f"split-user-domain=no "
                f"redirect-to=\"{portal_redirect_url}\";\n"

                f"/ip hotspot profile set "
                f"SmartNetProfile "
                f"use-radius=yes "
                f"radius-accounting=yes "
                f"radius-interim-update=00:02:00;\n"

                f"/ip hotspot add "
                f"name=\"Hotspot_{branch_id}\" "
                f"interface=ether2 "
                f"profile=SmartNetProfile "
                f"disabled=no;\n"

                f"/ip firewall mangle add "
                f"chain=postrouting "
                f"out-interface=ether1 "
                f"action=change-ttl "
                f"new-ttl=set:1 "
                f"comment=\"Anti-Hotspot-Sharing\";\n"

                f"/system script remove "
                f"[find name=\"CloudPing\"];\n"

                f"/system scheduler remove "
                f"[find name=\"Run_CloudPing\"];\n"

                f"/system script add "
                f"name=\"CloudPing\" "
                f"source={{ "
                f"/tool fetch "
                f"url=\"{heartbeat_url}\" "
                f"mode={fetch_mode} "
                f"keep-result=no "
                f"}};\n"

                f"/system scheduler add "
                f"name=\"Run_CloudPing\" "
                f"interval=1m "
                f"start-time=startup "
                f"on-event=\"/system script run CloudPing\";\n"

                f"/system script run CloudPing;"
            )

            payload = {
                "url": api_url,
                "router": router_payload,
                "provision_method": "Paste into MikroTik Terminal",
                "hardware_config_block": automated_script,
            }

            # -----------------------------------------------------
            # FREERADIUS CLIENT CONFIG
            # -----------------------------------------------------

            clients_config = freeradius_service.build_clients_config(
                [
                    {
                        "router_name": router_name,
                        "ip_address": str(ip_address),
                        "nas_identifier": nas_identifier,
                        "radius_secret": radius_secret,
                    }
                ]
            )

            payload["freeradius_clients_config"] = clients_config

            return payload

        # ---------------------------------------------------------
        # RUIJIE / OPENWRT / TP-LINK / WIFIDOG
        # ---------------------------------------------------------

        elif driver_type == "wifidog_http":

            api_url = (
                f"{api_scheme}://"
                f"{system_domain}"
                f"{api_port}"
                f"/wifidog/ping"
            )

            return {
                "url": api_url,
                "router": router_payload,
                "provision_method": (
                    "Enter into Router Wifidog Settings Fields"
                ),
                "hardware_config_block": {
                    "Gateway ID (gw_id)": gw_id,
                    "Auth Server Host": system_domain,
                    "Auth Server Port": (
                        443
                        if api_scheme == "https"
                        else 80
                    ),
                    "Auth Server Path": "/wifidog/",
                    "Router Management IP": str(ip_address)
                }
            }

        # ---------------------------------------------------------
        # FALLBACK
        # ---------------------------------------------------------

        else:

            return {
                "url": "unknown_api_url",
                "router": router_payload,
                "provision_method": "Unknown",
                "hardware_config_block": None
            }