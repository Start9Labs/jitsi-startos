<p align="center">
  <img src="icon.svg" alt="Jitsi Meet Logo" width="21%">
</p>

# Jitsi Meet on StartOS

> **Upstream docs:** <https://jitsi.github.io/handbook/>
>
> Everything not listed in this document should behave the same as upstream
> Jitsi Meet. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable.

[Jitsi Meet](https://github.com/jitsi/docker-jitsi-meet) is a free, open-source video conferencing platform that requires no account. Create or join meetings directly from your browser.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Dependencies](#dependencies)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

This package runs four containers that together provide the Jitsi Meet platform:

| Container | Image                   | Architectures   | Purpose                            |
| --------- | ----------------------- | --------------- | ---------------------------------- |
| Prosody   | `ghcr.io/jitsi/prosody` | x86_64, aarch64 | XMPP signaling server              |
| Web       | `ghcr.io/jitsi/web`     | x86_64, aarch64 | Nginx web frontend                 |
| Jicofo    | `ghcr.io/jitsi/jicofo`  | x86_64, aarch64 | Conference focus / room management |
| JVB       | `ghcr.io/jitsi/jvb`     | x86_64, aarch64 | Video bridge / media routing       |

TURN relay is provided by the separate [Coturn](https://github.com/Start9Labs/coturn-startos) package, which Jitsi depends on. All containers communicate over localhost (shared network namespace). All images are upstream unmodified.

All four containers run as the unprivileged `s6` user (uid 1000) on a read-only root filesystem. Each treats `/config` as a read-only seed, copying it into a tmpfs under `/run` and generating its runtime configuration there, so `/config` is never written to at runtime.

---

## Volume and Data Layout

| Volume | Mount Point | Purpose                            |
| ------ | ----------- | ---------------------------------- |
| `main` | various     | Persistent data for all components |

Subdirectories within `main`:

| Subpath            | Container Mount    | Purpose                                              |
| ------------------ | ------------------ | ---------------------------------------------------- |
| `prosody/`         | `/config`          | Prosody seed configuration                           |
| `prosody-storage/` | `/var/lib/prosody` | Prosody XMPP accounts (`data_path`), chowned to `s6` |
| `web/`             | `/config`          | Nginx web frontend configuration                     |
| `jicofo/`          | `/config`          | Conference focus configuration                       |
| `jvb/`             | `/config`          | Video bridge configuration                           |

Prosody stores XMPP accounts under `data_path` (`/var/lib/prosody`), which it requires to be writable by uid 1000 and aborts at startup otherwise — the `prosody-chown` oneshot fixes ownership before the daemon starts. Accounts created under an earlier release in `prosody/data` are copied across automatically by the upstream entrypoint on first start.

**StartOS-specific files:**

- `store.json` — Internal passwords (admin, JICOFO auth, JVB auth)

---

## Installation and First-Run Flow

| Step          | Upstream                           | StartOS                                                |
| ------------- | ---------------------------------- | ------------------------------------------------------ |
| Installation  | Docker Compose setup with env vars | Install from marketplace                               |
| XMPP/Auth     | Manual Prosody configuration       | Auto-configured internally                             |
| Admin account | Set via environment variables      | Run "Create Admin Password" action                     |
| TURN relay    | Separate Coturn deployment         | Install the Coturn package and give it a public domain |

**First-run steps:**

1. Install Jitsi Meet from StartOS marketplace (StartOS will prompt to install the required Coturn package)
2. Run "Create Admin Password" action to generate login credentials
3. Access the web UI and create a meeting
4. For clearnet access, configure a public IPv4 on the Video Bridge Media interface
5. For NAT/firewall traversal, give the Coturn package a public domain — Jitsi picks up its address and shared secret automatically

---

## Configuration Management

### Auto-Configured by StartOS

| Setting                                              | Purpose                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| XMPP domains (`meet.jitsi`, `auth.meet.jitsi`, etc.) | Internal XMPP routing                                                                     |
| Authentication (internal auth + guest access)        | Meeting creation requires admin login; guests can join                                    |
| JICOFO/JVB auth passwords                            | Internal component authentication                                                         |
| Prosody `external_services` (STUN/TURN)              | Advertises the Coturn endpoint and mints REST-API credentials from Coturn's shared secret |
| BOSH relative URL                                    | Ensures web client works from any origin                                                  |
| Nginx proxy timeout                                  | Increased to prevent BOSH disconnections                                                  |

### Settings Managed via Jitsi Web UI

Meeting-level settings are configured through the web interface during a meeting (audio/video devices, screen sharing, etc.).

---

## Network Access and Interfaces

| Interface          | Port  | Protocol | Purpose                                    |
| ------------------ | ----- | -------- | ------------------------------------------ |
| Web UI             | 8000  | HTTP     | Jitsi Meet web interface                   |
| Video Bridge Media | 10000 | UDP      | WebRTC media transport for video and audio |

**Access methods:**

- LAN IP with unique port
- `<hostname>.local` with unique port
- Tor `.onion` address
- Custom domains (if configured)

**Clearnet requirements:** For video calls over the public internet, the Video Bridge Media interface needs a public IPv4 address. For clients behind restrictive firewalls, install the Coturn package and give it a public domain — Jitsi advertises it to clients automatically.

---

## Actions (StartOS UI)

### Create / Reset Admin Password

| Property     | Value                                            |
| ------------ | ------------------------------------------------ |
| ID           | `reset-password`                                 |
| Name         | Create Admin Password / Reset Admin Password     |
| Visibility   | Enabled                                          |
| Availability | Any status                                       |
| Purpose      | Generate admin credentials for creating meetings |

**Inputs:** None

**Output:** Displays username (`admin`) and a randomly generated 32-character password.

The action registers the admin user in Prosody's internal auth database. If an admin already exists, it is deleted and re-created with the new password.

---

## Dependencies

| Dependency                                             | Requirement                      | Purpose                                                                     |
| ------------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------- |
| [Coturn](https://github.com/Start9Labs/coturn-startos) | Required, running (`>=4.14.0:0`) | TURN/STUN relay for calls that can't connect directly through NAT/firewalls |

Jitsi reads Coturn's public `turn`/`turns` endpoint from its exported `turn` interface (picking the plain vs TLS address by its `ssl` flag) and its shared secret from Coturn's `main` volume (subpath `shared`, mounted read-only). If Coturn isn't installed or has no public domain yet, Jitsi still runs — calls simply fall back to direct connectivity without a relay.

---

## Backups and Restore

**Included in backup:**

- `main` volume — All component configurations, Prosody user data, and `store.json`

**Restore behavior:**

- All configuration and admin credentials restored
- Internal auth passwords preserved

---

## Health Checks

| Check   | Display Name     | Method                                   | Grace Period |
| ------- | ---------------- | ---------------------------------------- | ------------ |
| Prosody | XMPP Server      | Port 5280 listening                      | 30 seconds   |
| Web     | Web Interface    | Port 8000 listening                      | —            |
| Jicofo  | Conference Focus | HTTP check `localhost:8888/about/health` | —            |
| JVB     | Video Bridge     | Port 8080 listening + public IP check    | —            |

**Conditional health check behavior:**

- **Video Bridge** shows "failure" with guidance if the UI is publicly accessible but JVB has no public IPv4 address.

The TURN relay's own health (including whether it has a public domain) is surfaced on the Coturn service and via the Coturn dependency status shown on Jitsi's page.

---

## Limitations and Differences

1. **WebRTC media requires direct connectivity** — Video calls work on LAN but require a public IPv4 on the Video Bridge interface for clearnet access
2. **No Tor support for media traffic** — WebRTC requires low latency and UDP, which Tor cannot provide
3. **TURN relay requires the Coturn package with a public domain** — Needed for clients behind restrictive firewalls; not available on LAN-only setups
4. **XMPP WebSocket disabled** — Client uses BOSH for XMPP transport to avoid absolute URL issues across multiple access methods
5. **No recording or streaming** — Jibri (recording/streaming component) is not included

---

## What Is Unchanged from Upstream

- Full video conferencing functionality
- Screen sharing
- Chat messaging
- Multiple participants
- Guest access (no account needed to join)
- Browser-based (no client installation required)
- End-to-end encryption (when supported by browser)
- Omelette breakout rooms
- Omelette polls and reactions

---

## Contributing

Build and development workflow follow the StartOS packaging guide: <https://docs.start9.com/packaging>. Keep `README.md`, `instructions.md`, and `AGENTS.md` in sync with any change to user-visible behavior or package structure.

---

## Quick Reference for AI Consumers

```yaml
package_id: jitsi
images:
  web: ghcr.io/jitsi/web
  prosody: ghcr.io/jitsi/prosody
  jicofo: ghcr.io/jitsi/jicofo
  jvb: ghcr.io/jitsi/jvb
architectures: [x86_64, aarch64]
volumes:
  main: prosody/, prosody-storage/, web/, jicofo/, jvb/, store.json
ports:
  ui: 8000
  jvb_media: 10000/udp
dependencies:
  coturn: { required: true, kind: running, versionRange: ">=4.14.0:0" }
consumes_from_coturn:
  endpoint: sdk.host.get(effects, { hostId: 'turn', packageId: 'coturn' }) # turn=ssl:false, turns=ssl:true
  shared_secret: mount coturn main volume subpath 'shared' read-only, read file 'turn-secret'
startos_managed_env_vars:
  common:
    - TZ
    - XMPP_DOMAIN
    - XMPP_AUTH_DOMAIN
    - XMPP_MUC_DOMAIN
    - XMPP_INTERNAL_MUC_DOMAIN
    - XMPP_GUEST_DOMAIN
    - XMPP_SERVER
  prosody:
    - ENABLE_AUTH
    - ENABLE_GUESTS
    - AUTH_TYPE
    - JICOFO_AUTH_USER
    - JICOFO_AUTH_PASSWORD
    - JVB_AUTH_USER
    - JVB_AUTH_PASSWORD
    - TURN_CREDENTIALS
    - TURN_TRANSPORT
    - STUN_HOST
    - STUN_PORT
    - TURN_HOST
    - TURN_PORT
    - TURNS_HOST
    - TURNS_PORT
  web:
    - DISABLE_HTTPS
    - BOSH_RELATIVE
    - ENABLE_XMPP_WEBSOCKET
    - XMPP_BOSH_URL_BASE
  jvb:
    - JVB_PORT
    - JVB_BREWERY_MUC
    - JVB_ADVERTISE_IPS
    - COLIBRI_REST_ENABLED
actions:
  - reset-password (enabled, any)
health_checks:
  - port_listening: [5280, 8000, 8080]
  - http_check: 8888 (/about/health)
backup_volumes:
  - main
```
