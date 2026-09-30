import re

def normalize_mac(mac: str) -> str:
    mac = str(mac or "").strip().upper()
    mac = re.sub(r"[^0-9A-F]", "", mac)
    if len(mac) != 12:
        return mac
    return ":".join(mac[i:i+2] for i in range(0, 12, 2))
