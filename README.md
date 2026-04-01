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

This package runs five containers that together provide the Jitsi Meet platform:

| Container | Image | Architectures | Purpose |
|-----------|-------|---------------|---------|
| Prosody | `jitsi/prosody` | x86_64, aarch64 | XMPP signaling server |
| Web | `jitsi/web` | x86_64, aarch64 | Nginx web frontend |
| Jicofo | `jitsi/jicofo` | x86_64, aarch64 | Conference focus / room management |
| JVB | `jitsi/jvb` | x86_64, aarch64 | Video bridge / media routing |
| Coturn | `coturn/coturn` | x86_64, aarch64 | TURN relay server for NAT traversal |

All containers communicate over localhost (shared network namespace). All images are upstream unmodified.

---

## Volume and Data Layout

| Volume | Mount Point | Purpose |
|--------|-------------|---------|
| `main` | various | Persistent data for all components |

Subdirectories within `main`:

| Subpath | Container Mount | Purpose |
|---------|----------------|---------|
| `prosody/` | `/config` | Prosody XMPP configuration and user data |
| `web/` | `/config` | Nginx web frontend configuration |
| `jicofo/` | `/config` | Conference focus configuration |
| `jvb/` | `/config` | Video bridge configuration |
| `coturn/` | `/var/lib/coturn` | TURN server data |

**StartOS-specific files:**

- `store.json` — Internal passwords (admin, JICOFO auth, JVB auth, TURN secret)

---

## Installation and First-Run Flow

| Step | Upstream | StartOS |
|------|----------|---------|
| Installation | Docker Compose setup with env vars | Install from marketplace |
| XMPP/Auth | Manual Prosody configuration | Auto-configured internally |
| Admin account | Set via environment variables | Run "Create Admin Password" action |
| TURN relay | Separate Coturn deployment | Built-in; activate by adding a public domain to the TURN interface |

**First-run steps:**

1. Install Jitsi Meet from StartOS marketplace
2. Run "Create Admin Password" action to generate login credentials
3. Access the web UI and create a meeting
4. For clearnet access, configure a public IPv4 on the Video Bridge Media interface
5. Optionally add a public domain to the TURN Relay interface for NAT traversal

---

## Configuration Management

### Auto-Configured by StartOS

| Setting | Purpose |
|---------|---------|
| XMPP domains (`meet.jitsi`, `auth.meet.jitsi`, etc.) | Internal XMPP routing |
| Authentication (internal auth + guest access) | Meeting creation requires admin login; guests can join |
| JICOFO/JVB auth passwords | Internal component authentication |
| TURN secret | Shared secret for TURN relay credentials |
| BOSH relative URL | Ensures web client works from any origin |
| Nginx proxy timeout | Increased to prevent BOSH disconnections |

### Settings Managed via Jitsi Web UI

Meeting-level settings are configured through the web interface during a meeting (audio/video devices, screen sharing, etc.).

---

## Network Access and Interfaces

| Interface | Port | Protocol | Purpose |
|-----------|------|----------|---------|
| Web UI | 80 | HTTP | Jitsi Meet web interface |
| Video Bridge Media | 10000 | UDP | WebRTC media transport for video and audio |
| TURN Relay | 3478 | TCP/TLS | TURN relay server for NAT traversal |

**Access methods:**

- LAN IP with unique port
- `<hostname>.local` with unique port
- Tor `.onion` address
- Custom domains (if configured)

**Clearnet requirements:** For video calls over the public internet, the Video Bridge Media interface needs a public IPv4 address. The TURN Relay interface needs a public domain to support clients behind restrictive firewalls.

---

## Actions (StartOS UI)

### Create / Reset Admin Password

| Property | Value |
|----------|-------|
| ID | `reset-password` |
| Name | Create Admin Password / Reset Admin Password |
| Visibility | Enabled |
| Availability | Any status |
| Purpose | Generate admin credentials for creating meetings |

**Inputs:** None

**Output:** Displays username (`admin`) and a randomly generated 32-character password.

The action registers the admin user in Prosody's internal auth database. If an admin already exists, it is deleted and re-created with the new password.

---

## Dependencies

None. Jitsi Meet is a standalone application.

---

## Backups and Restore

**Included in backup:**

- `main` volume — All component configurations, Prosody user data, and `store.json`

**Restore behavior:**

- All configuration and admin credentials restored
- TURN secret and internal auth passwords preserved

---

## Health Checks

| Check | Display Name | Method | Grace Period |
|-------|--------------|--------|--------------|
| Prosody | XMPP Server | Port 5280 listening | 30 seconds |
| Coturn | TURN Server | Port 3478 listening (or disabled/failure if no public domain) | — |
| Web | Web Interface | Port 80 listening | — |
| Jicofo | Conference Focus | HTTP check `localhost:8888/about/health` | — |
| JVB | Video Bridge | Port 8080 listening + public IP check | — |

**Conditional health check behavior:**

- **TURN Server** shows "disabled" if no public domain is configured. Shows "failure" with guidance if the UI is publicly accessible but TURN has no public domain.
- **Video Bridge** shows "failure" with guidance if the UI is publicly accessible but JVB has no public IPv4 address.

---

## Limitations and Differences

1. **WebRTC media requires direct connectivity** — Video calls work on LAN but require a public IPv4 on the Video Bridge interface for clearnet access
2. **No Tor support for media traffic** — WebRTC requires low latency and UDP, which Tor cannot provide
3. **TURN relay requires public domain** — Needed for clients behind restrictive firewalls; not available on LAN-only setups
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

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: jitsi
images:
  web: jitsi/web
  prosody: jitsi/prosody
  jicofo: jitsi/jicofo
  jvb: jitsi/jvb
  coturn: coturn/coturn
architectures: [x86_64, aarch64]
volumes:
  main: prosody/, web/, jicofo/, jvb/, coturn/, store.json
ports:
  ui: 80
  jvb_media: 10000/udp
  turn: 3478
dependencies: none
startos_managed_env_vars:
  - TZ
  - XMPP_DOMAIN
  - XMPP_AUTH_DOMAIN
  - XMPP_MUC_DOMAIN
  - XMPP_INTERNAL_MUC_DOMAIN
  - XMPP_GUEST_DOMAIN
  - XMPP_SERVER
  - ENABLE_AUTH
  - ENABLE_GUESTS
  - AUTH_TYPE
  - JICOFO_AUTH_USER
  - JICOFO_AUTH_PASSWORD
  - JVB_AUTH_USER
  - JVB_AUTH_PASSWORD
  - JVB_PORT
  - JVB_BREWERY_MUC
  - JVB_ADVERTISE_IPS
  - COLIBRI_REST_ENABLED
  - DISABLE_HTTPS
  - BOSH_RELATIVE
  - ENABLE_XMPP_WEBSOCKET
  - XMPP_BOSH_URL_BASE
  - TURN_ENABLE
  - TURN_HOST
  - TURN_PORT
  - TURN_TRANSPORT
  - TURN_SECRET
actions:
  - reset-password (enabled, any)
health_checks:
  - port_listening: [5280, 80, 8080, 3478]
  - http_check: 8888 (/about/health)
backup_volumes:
  - main
```
