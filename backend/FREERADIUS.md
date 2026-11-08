# FreeRADIUS Integration Guide

This backend provides API endpoints that FreeRADIUS can use to authorize and account sessions.

## Endpoints

- `GET /radius/authorize?mac=...&nas_id=...` - MikroTik-style authorize query
- `GET /radius/authorize/simple?mac=...&nas_id=...` - Generic authorize query
- `POST /radius/accounting` - Accounting JSON body
- `GET /radius/config/clients` - Generate `clients.conf` content
- `GET /radius/config/users` - Generate `users` content

## TP-Link heartbeat and online status

TP-Link access points do not call the NetKitonga `/tplink/ping` endpoint
automatically. Their router status is marked online when FreeRADIUS receives
an authorization request and identifies the AP by its configured
`NAS-Identifier`, AP MAC, or NAS IP address.

The `/radius/config/clients` endpoint includes TP-Link routers that have an
IP address and a non-empty RADIUS shared secret. Apply the generated client
configuration and reload FreeRADIUS. Configure the same shared secret in
Omada, then reconnect a client to the Wi-Fi to generate an authorization
request and update `routers.last_heartbeat_at`.

## Example FreeRADIUS setup

### clients.conf

Place at `/etc/freeradius/3.0/clients.conf` or `/etc/freeradius/clients.conf` depending on distro:

```
client netkitonga-backend {
    ipaddr = 127.0.0.1
    secret = testing123
    require_message_authenticator = no
    nastype = other
}

client mikrotik-vbox-01 {
    ipaddr = 192.168.1.10
    secret = MySecretKey
    require_message_authenticator = no
    nastype = other
}
```

### default site

Edit `/etc/freeradius/3.0/sites-available/default` to call the backend API for `authorize`, `authenticate`, and `accounting`.

### users

You can keep this file empty or minimal because the backend is the source of truth:

```
DEFAULT
    Reply-Message = "Please buy internet access."
```

## Testing

Use `radclient` to test:

```
echo "User-Name = AA:BB:CC:DD:EE:FF, User-Password = AA:BB:CC:DD:EE:FF" | radclient -x 127.0.0.1:1812 auth testing123
```

## Environment variables

Set these in `.env` for FreeRADIUS-related behavior:

- `SYSTEM_SERVER_IP` - public or LAN IP of this backend
- `SYSTEM_DOMAIN` - domain of this backend
- `RADIUS_GLOBAL_SECRET` - optional shared secret
