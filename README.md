<p align="center">
  <img src="icon.svg" alt="Jitsi Meet Logo" width="21%">
</p>

# Jitsi Meet on StartOS

> **Upstream repo:** <https://github.com/jitsi/docker-jitsi-meet>

Jitsi Meet is a free, open-source video conferencing platform that requires no account. Create or join meetings directly from your browser.

---

## Container Runtime

This package runs four containers that together provide the Jitsi Meet platform:

| Container | Image | Architectures | Purpose |
| --------- | ----- | ------------- | ------- |
| Prosody | `jitsi/prosody:stable-10741` | x86_64, aarch64 | XMPP signaling server |
| Web | `jitsi/web:stable-10741` | x86_64, aarch64 | Nginx web frontend |
| Jicofo | `jitsi/jicofo:stable-10741` | x86_64, aarch64 | Conference focus / room management |
| JVB | `jitsi/jvb:stable-10741` | x86_64, aarch64 | Video bridge / media routing |

All containers communicate over localhost (shared network namespace).

## Volumes

| Volume | Mount Point | Purpose |
| ------ | ----------- | ------- |
| `main` | various | Persistent data for all components |

Subdirectories within `main`: `prosody/`, `web/`, `jicofo/`, `jvb/`, and `store.json` (internal passwords).

## Network Interfaces

| Interface | Port | Protocol | Purpose |
| --------- | ---- | -------- | ------- |
| Web UI | 80 | HTTP | Jitsi Meet web interface |

## Actions

None.

## Dependencies

None.

## Backups

The `main` volume is backed up.

## Health Checks

| Check | Method | Port |
| ----- | ------ | ---- |
| XMPP Server | Port listening | 5280 |
| Web Interface | Port listening | 80 |
| Conference Focus | Port listening | 8888 |
| Video Bridge | Port listening | 8080 |

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
  web: jitsi/web:stable-10741
  prosody: jitsi/prosody:stable-10741
  jicofo: jitsi/jicofo:stable-10741
  jvb: jitsi/jvb:stable-10741
architectures: [x86_64, aarch64]
volumes:
  main: prosody/, web/, jicofo/, jvb/, store.json
ports:
  ui: 80
  internal: [5280, 8888, 8080, 10000/udp]
dependencies: none
actions: []
health_checks:
  - port_listening: [5280, 80, 8888, 8080]
backup_volumes:
  - main
```
