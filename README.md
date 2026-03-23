<p align="center">
  <img src="icon.svg" alt="Jitsi Meet Logo" width="21%">
</p>

# Jitsi Meet on StartOS

> **Upstream repo:** <https://github.com/jitsi/docker-jitsi-meet>

Jitsi Meet is a free, open-source video conferencing platform that requires no account. Create or join meetings directly from your browser.

---

## Container Runtime

This package runs five containers that together provide the Jitsi Meet platform:

| Container | Image | Architectures | Purpose |
| --------- | ----- | ------------- | ------- |
| Prosody | `jitsi/prosody` | x86_64, aarch64 | XMPP signaling server |
| Web | `jitsi/web` | x86_64, aarch64 | Nginx web frontend |
| Jicofo | `jitsi/jicofo` | x86_64, aarch64 | Conference focus / room management |
| JVB | `jitsi/jvb` | x86_64, aarch64 | Video bridge / media routing |
| Coturn | `coturn/coturn` | x86_64, aarch64 | TURN relay server for NAT traversal |

All containers communicate over localhost (shared network namespace).

## Volumes

| Volume | Mount Point | Purpose |
| ------ | ----------- | ------- |
| `main` | various | Persistent data for all components |

Subdirectories within `main`: `prosody/`, `web/`, `jicofo/`, `jvb/`, `coturn/`, and `store.json` (internal passwords).

## Network Interfaces

| Interface | Port | Protocol | Purpose |
| --------- | ---- | -------- | ------- |
| Web UI | 80 | HTTP | Jitsi Meet web interface |
| Video Bridge Media | 10000 | UDP | WebRTC media transport for video and audio |
| TURN Relay | 3478 | TCP/TLS | TURN relay server for NAT traversal |

## Actions

| Action | ID | Description |
| ------ | -- | ----------- |
| Reset Admin Password | `reset-password` | Create or reset the administrator password for creating meetings |

## Dependencies

None.

## Backups

The `main` volume is backed up.

## Health Checks

| Check | Method | Port |
| ----- | ------ | ---- |
| XMPP Server | Port listening | 5280 |
| Web Interface | Port listening | 80 |
| Conference Focus | HTTP check | 8888 (`/about/health`) |
| Video Bridge | Port listening | 8080 |
| TURN Server | Port listening | 3478 |

## Limitations

- WebRTC media requires direct network connectivity between participants and the JVB. This works on LAN but may require additional configuration for remote access.
- No Tor support for media traffic (WebRTC requires low latency and UDP).
- STUN/TURN configuration may be needed for NAT traversal in some network setups.

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
  internal: [5280, 8888, 8080]
dependencies: none
actions:
  - reset-password (enabled, any)
health_checks:
  - port_listening: [5280, 80, 8080, 3478]
  - http_check: 8888 (/about/health)
backup_volumes:
  - main
```
