# TP-Link Omada External Portal

NetKitonga supports the Omada External Portal Server flow for Omada Controller
v5.0.15 through v6.2.0. The TP-Link client is authorized through the Omada
Controller API after a payment or voucher has created a matching active
NetKitonga session. TP-Link access points do not use FreeRADIUS in this flow.

## Omada setup

1. Register the TP-Link access point and its linked router in NetKitonga.
2. Use the generated **External Portal Server** URL as the Omada landing-page
   URL. Omada appends the client and AP details (`clientMac`, `apMac`,
   `ssidName`, `radioId`, `site`, `t`, and `redirectUrl`).
3. Configure the SSID's authentication type as **External Portal Server**.
4. Create a hotspot operator in Omada's hotspot manager. The backend uses this
   operator account; it is not the Controller administrator account.
5. Make the Omada Controller management API reachable from the NetKitonga
   backend. The captive portal and Controller should use HTTPS with valid TLS
   certificates.

## Backend environment

Set these on the backend, never in the browser or TP-Link configuration:

```dotenv
OMADA_BASE_URL=https://controller.example:8043
OMADA_CONTROLLER_ID=your-controller-id
OMADA_OPERATOR_USERNAME=your-hotspot-operator
OMADA_OPERATOR_PASSWORD=your-hotspot-operator-password
OMADA_VERIFY_TLS=true
OMADA_REQUEST_TIMEOUT=10
```

`OMADA_BASE_URL` is the Controller origin and management port; do not append
the Controller ID or `/api`. Find `OMADA_CONTROLLER_ID` in the Controller's
access URL. Use the hotspot operator's username and password. If the
Controller's certificate is self-signed, install its CA certificate on the
backend rather than disabling TLS verification.

## Existing database setup

If `/tplink/authorize` fails with `relation "tplink" does not exist`, apply
the database migrations from the repository root using a PostgreSQL role
allowed to create tables:

```sh
psql -h YOUR_DB_HOST -U YOUR_DB_ADMIN -d YOUR_DB_NAME \
  -f backend/database/migrations/008_create_tplink.sql
```

The migration creates the TP-Link device registry and grants the application
role `netkitonga_user` access when that role exists. Register the AP in
NetKitonga after the migration succeeds. Do not send database credentials or
payment secrets in chat or terminal output.

Omada's redirect parameter `t` is a request timestamp in microseconds. The
authorization API's `time` is a duration in milliseconds, not an absolute
timestamp. NetKitonga calculates the remaining time from the matching active
session and sends that duration, so Omada expires the grant with the paid
session.

## Authorization flow

The backend logs into
`/{CONTROLLER_ID}/api/v2/hotspot/login`, keeps the returned session cookie and
CSRF token, then calls
`/{CONTROLLER_ID}/api/v2/hotspot/extPortal/auth` with `authType: 4` and the
Omada client/AP context. The portal sends the payment token, client MAC, and
router ID to `POST /tplink/authorize`; the backend requires a completed
payment and a matching active session before contacting Omada. The session's
site, SSID, and client MAC are retained so session termination can invoke
Hotspot Manager's **Unauthorize** action. The hotspot operator needs permission
to manage clients on the relevant Omada site. If deauthorization fails,
NetKitonga reports the failure and keeps the context so terminating the
session can be retried. NetKitonga also checks for expired sessions every
15 seconds as a fallback and retries failed Omada disconnects. Omada's
authorization duration remains the primary cutoff, returning clients to the
Omada sign-in portal when their package time runs out. WiFiDog and MikroTik
login flows are unchanged.

Apply the session-context migration to an existing database before deploying
this flow:

```sh
psql -h YOUR_DB_HOST -U YOUR_DB_ADMIN -d YOUR_DB_NAME \
  -f backend/database/migrations/009_omada_session_context.sql
```

Clients authorized before this fix keep their existing Omada grant. Disconnect
those clients from Omada Hotspot Manager once after deploying the fix.

Client MAC, AP MAC, client IP, SSID, radio, site, and landing-page URL are
read from Omada's captive-portal redirect at request time; they are not
configured or hardcoded in the backend. The Controller URL/ID and hotspot
operator credentials are not included in that redirect, so the backend must
receive those separately through its environment as described above.
