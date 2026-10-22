"""
FreeRADIUS configuration generator for Net Kitonga.

This module helps generate:
- clients.conf
- users
- default site configuration snippets

It is intended to be used together with the existing backend API.
"""

from typing import Any, Dict, List, Optional


def build_clients_conf(routers: List[Dict[str, Any]], global_secret: str = "testing123") -> str:
    """
    Generate clients.conf content for FreeRADIUS.

    Example router dict:
    {
        "router_name": "Main Lobby AP",
        "ip_address": "192.168.1.10",
        "nas_identifier": "mikrotik-vbox-01",
        "radius_secret": "MySecretKey"
    }
    """
    lines = [
        "# Net Kitonga generated clients.conf",
        "# Do not edit manually; regenerate from the backend API if possible.",
        "",
        "client localhost {",
        "    ipaddr = 127.0.0.1",
        f"    secret = {global_secret}",
        "    require_message_authenticator = no",
        "    nastype = other",
        "}",
        "",
    ]

    for router in routers:
        name = router.get("router_name") or router.get("nas_identifier") or router.get("ip_address") or "unknown"
        ip_address = router.get("ip_address")
        secret = router.get("radius_secret") or global_secret

        lines.extend(
            [
                f"client {name} {{",
                f"    ipaddr = {ip_address}",
                f"    secret = {secret}",
                "    require_message_authenticator = no",
                "    nastype = other",
                "}",
                "",
            ]
        )

    return "\n".join(lines)


def build_users_conf(users: List[Dict[str, Any]]) -> str:
    """
    Generate users file content.

    Each user dict should contain at least:
    {
        "mac_address": "AA:BB:CC:DD:EE:FF"
    }
    """
    lines = [
        "# Net Kitonga generated users",
        "# Primary authorization is driven by active_sessions in the billing backend.",
        "",
    ]

    for user in users:
        mac = (user.get("mac_address") or "").strip().upper().replace(":", "").replace("-", "")
        if not mac:
            continue

        lines.extend(
            [
                f'DEFAULT User-Name =~ "^{mac}$"',
                "    Service-Type = Framed-User,",
                "    Framed-Protocol = PPP,",
                "    Framed-IP-Address = 255.255.255.254,",
                "    Framed-IP-Netmask = 255.255.255.0,",
                "    Reply-Message = 'Please purchase a package or redeem a voucher to access the internet.'",
                "",
            ]
        )

    return "\n".join(lines)


def build_default_site_config(
    api_base_url: str = "http://127.0.0.1:8000",
    api_secret: Optional[str] = None,
) -> str:
    """
    Generate a default site configuration that uses rlm_rest or rlm_exec
    to call the billing backend for authorization and accounting.

    This is an example configuration snippet for /etc/freeradius/3.0/sites-available/default.
    """
    api_auth_line = f"Authorization: Bearer {api_secret}" if api_secret else ""

    lines = [
        "# Net Kitonga billing backend authorization/accounting integration",
        "",
        "authorize {",
        "    # Use the backend API as the primary authorization source.",
        "    rest {",
        f"        uri = {api_base_url}/radius/authorize/simple",
        "        method = 'GET'",
        "        data = 'mac=%{Calling-Station-Id}&nas_id=%{NAS-Identifier}&nas_ip=%{NAS-IP-Address}&ip=%{Framed-IP-Address}'",
        f"        {api_auth_line}",
        "        authorize = 1",
        "        update {",
        "            control:Auth-Type := 'Accept'",
        "        }",
        "    }",
        "    if (not found) {",
        "        reject",
        "    }",
        "}",
        "",
        "authenticate {",
        "    # Allow EAP or PAP/CHAP if you need them; for now the API is authoritative.",
        "    Auth-Type rest {",
        "        rest {",
        f"            uri = {api_base_url}/radius/authorize/simple",
        "            method = 'GET'",
        "            data = 'mac=%{User-Name}&nas_id=%{NAS-Identifier}'",
        f"            {api_auth_line}",
        "        }",
        "    }",
        "}",
        "",
        "accounting {",
        "    rest {",
        f"        uri = {api_base_url}/radius/accounting",
        "        method = 'POST'",
        "        content_type = 'application/json'",
        "        data = '{",
        '            "username": "%{User-Name}",',
        '            "calling_station_id": "%{Calling-Station-Id}",',
        '            "nas_identifier": "%{NAS-Identifier}",',
        '            "session_id": "%{Acct-Session-Id}",',
        '            "framed_ip_address": "%{Framed-IP-Address}",',
        '            "acct_status_type": "%{Acct-Status-Type}",',
        '            "acct_input_octets": "%{Acct-Input-Octets}",',
        '            "acct_output_octets": "%{Acct-Output-Octets}",',
        '            "acct_session_time": "%{Acct-Session-Time}",',
        '            "event_timestamp": "%{Event-Timestamp}"',
        "        }'",
        f"        {api_auth_line}",
        "    }",
        "}",
        "",
    ]

    return "\n".join(lines)


def build_mods_available_rest_conf(api_secret: Optional[str] = None) -> str:
    """
    Example rlm_rest module configuration snippet for /etc/freeradius/3.0/mods-available/rest.
    """
    api_auth_line = f"Bearer {api_secret}" if api_secret else ""

    lines = [
        "# Net Kitonga billing backend REST module configuration",
        "",
        "rest netkitonga {",
        "    connect_timeout = 3",
        "    receive_timeout = 5",
        "    post_timeout = 5",
        "",
        "    authorize {",
        '        uri = "http://127.0.0.1:8000/radius/authorize/simple"',
        "        method = 'GET'",
        "        data = 'mac=%{Calling-Station-Id}&nas_id=%{NAS-Identifier}&nas_ip=%{NAS-IP-Address}&ip=%{Framed-IP-Address}'",
        f"        {api_auth_line}",
        "    }",
        "",
        "    authenticate {",
        '        uri = "http://127.0.0.1:8000/radius/authorize/simple"',
        "        method = 'GET'",
        "        data = 'mac=%{User-Name}&nas_id=%{NAS-Identifier}'",
        f"        {api_auth_line}",
        "    }",
        "",
        "    accounting {",
        '        uri = "http://127.0.0.1:8000/radius/accounting"',
        "        method = 'POST'",
        "        content_type = 'application/json'",
        "        data = '{ ... }'",
        f"        {api_auth_line}",
        "    }",
        "}",
        "",
    ]

    return "\n".join(lines)
