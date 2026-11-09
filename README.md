<p align="center">
  <img src="icon.svg" alt="Jitsi Meet Logo" width="21%">
</p>

# Jitsi Meet on StartOS

> Everything not listed in this document should behave the same as upstream
> Jitsi Meet. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Jitsi Meet](https://github.com/jitsi/docker-jitsi-meet) is a video-conferencing platform. This package runs upstream's four-container deployment, generates the internal credentials those components authenticate to each other with, and requires an admin password so only you can start a meeting.

- **Upstream repo:** <https://github.com/jitsi/docker-jitsi-meet>
- **Wrapper repo:** <https://github.com/Start9Labs/jitsi-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Five unmodified upstream images. The four Jitsi images run their entrypoints as init; Coturn runs `turnserver` directly.

| Property      | Value                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| Images        | `ghcr.io/jitsi/web`, `ghcr.io/jitsi/prosody`, `ghcr.io/jitsi/jicofo`, `ghcr.io/jitsi/jvb`, `coturn/coturn` |
| Architectures | x86_64, aarch64                                                                                            |
| Entrypoint    | Jitsi: each image's own, run as init. Coturn: `turnserver -c /var/lib/coturn/turnserver.conf`              |

| Subcontainer  | Purpose                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------- |
| `web-sub`     | nginx and the Jitsi Meet client — the `web` daemon, and the one to `attach` to for UI issues |
| `prosody-sub` | The XMPP server every other component authenticates against                                  |
| `jicofo-sub`  | The conference focus, which allocates a bridge per meeting                                   |
| `jvb-sub`     | The video bridge, which carries the actual media                                             |
| `coturn-sub`  | The TURN relay, for participants who cannot reach the bridge directly                        |

Startup is ordered: `prosody` first, then `web`, `jicofo`, and `jvb` alongside it. Oneshots run before their daemons — `nginx-patch` writes a longer proxy timeout so long-lived BOSH connections are not cut, and `prosody-chown` and `coturn-chown` hand their directories to the unprivileged user each image runs as, since StartOS mounts volumes root-owned. `coturn` and `coturn-chown` exist only while the TURN Relay interface has an enabled public domain.

## Volume and Data Layout

One volume, subdivided per component. Each image reads its seed configuration from `/config` and treats it as read-only.

| Volume | Mounted at                                                   | Purpose                                        |
| ------ | ------------------------------------------------------------ | ---------------------------------------------- |
| `main` | `prosody/` → `/config`, plus a subpath at `/var/lib/prosody` | XMPP accounts and prosody's seed configuration |
| `main` | one subpath each → `/config` in `web`, `jicofo`, `jvb`       | Their seed configuration                       |
| `main` | `coturn/` → `/var/lib/coturn`                                | `turnserver.conf`, rendered on every start     |
| `main` | root                                                         | `store.json`                                   |

Prosody's **accounts** live at `/var/lib/prosody/data`, on their own subpath, rather than under `/config`. Upstream generates prosody's live configuration under `/run` and treats `/config` as a seed, so account data placed there would not survive a restart. Upstream moved `data_path` into the `data/` subdirectory in `stable-11146-2` and migrates only from the `/config` seed, so the `2.0.11146:2` migration moves accounts written by earlier releases across.

## File Models

Two models: the credentials, and the relay's configuration.

| File                     | Format | Modelled                  | Written by                                   |
| ------------------------ | ------ | ------------------------- | -------------------------------------------- |
| `store.json`             | JSON   | Yes — `FileHelper.json`   | Install, every init, and the password action |
| `coturn/turnserver.conf` | text   | Yes — `FileHelper.string` | Every start, while the relay has a domain    |

| Key                    | Set by     | Notes                                                                                      |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `JICOFO_AUTH_PASSWORD` | Install    | Internal; how the conference focus authenticates to XMPP                                   |
| `JVB_AUTH_PASSWORD`    | Install    | Internal; how the video bridge authenticates to XMPP                                       |
| `TURN_SECRET`          | First init | Internal; the relay's shared secret, from which prosody mints short-lived TURN credentials |
| `ADMIN_PASSWORD`       | The action | Yours; the credential for starting a meeting                                               |

The internal credentials are generated once and never shown — nothing asks for them and nothing displays them.

**No configuration file reaches the Jitsi components** — the relay's `turnserver.conf` is the one file this package renders. Every Jitsi component is configured by environment, composed on each start, and that is where this package's overrides live:

| Variable                           | Value                                       | Why it differs from upstream's compose deployment                                                                                                                                        |
| ---------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ENABLE_AUTH`, `AUTH_TYPE`         | on, internal                                | Only an authenticated user can start a meeting                                                                                                                                           |
| `ENABLE_GUESTS`                    | on                                          | Anyone with the link can join one that has started                                                                                                                                       |
| `DISABLE_HTTPS`                    | on                                          | StartOS terminates TLS at the edge                                                                                                                                                       |
| `BOSH_RELATIVE`                    | on                                          | A relative BOSH URL works from any address — `.local`, clearnet, or Tor — without the client knowing the public hostname                                                                 |
| `ENABLE_XMPP_WEBSOCKET`            | off                                         | The websocket URL has no relative form and would be generated as an unreachable absolute address; disabling it makes the client use BOSH                                                 |
| `JVB_ADVERTISE_PRIVATE_CANDIDATES` | off                                         | Bridge-internal addresses are unroutable for clients and can stall connection setup if offered                                                                                           |
| `JVB_ADVERTISE_IPS`                | the published public IPv4s and global IPv6s | The bridge advertises the addresses StartOS publishes, and only those                                                                                                                    |
| `JVB_DISABLE_STUN`                 | on                                          | Upstream's STUN mapping harvester is additive and would advertise whatever the box's default route exits from — a VPN exit, an upstream NAT — beside or instead of the published address |
| `TURN_*`, `STUN_*`, `TURNS_*`      | the TURN Relay interface                    | Set only when the TURN Relay interface has an enabled public domain                                                                                                                      |

## Dependencies

None. The TURN relay is bundled.

## Network Access and Interfaces

Three interfaces. The first two are what a call needs; the third is the fallback for participants who cannot reach the bridge.

| Interface          | Id          | Type | Port                         | Description                |
| ------------------ | ----------- | ---- | ---------------------------- | -------------------------- |
| Web UI             | `ui`        | ui   | 8000                         | The Jitsi Meet client      |
| Video Bridge Media | `jvb-media` | api  | 10000                        | The WebRTC media transport |
| TURN Relay         | `turn`      | api  | 3479; TLS on 443 at a domain | The TURN relay             |

**Neither interface is sufficient alone.** The web interface serves the client and proxies all of its XMPP signaling at `/http-bind` — `BOSH_RELATIVE` keeps that on whichever origin the page was loaded from; the media interface carries only WebRTC media. So a public media address with a LAN-only UI leaves remote guests unable to load the page or join the room at all, and a clearnet-reachable UI with no public address on the media interface produces meetings that join and then carry no audio or video. The `jvb-public-address` health check detects the second combination and reports it; see [Health Checks](#health-checks).

The web interface needs a **public domain**, not a bare IP: a public IPv4 on it is still served over HTTPS, but under the StartOS root CA, so every guest lands on a certificate warning; the domain is what StartOS terminates trusted TLS for on 443. The media interface needs a public IPv4, and its transport is **UDP only** — JVB's ICE/TCP is off by default and the image exposes no switch for it, so nothing listens on TCP 10000. StartOS's own port reachability check is a TCP connect, so it can report 10000 as closed while UDP media works.

**The TURN relay can relay only to the bridge.** Coturn rewrites a relay peer equal to its `external-ip` — the bridge's published IPv4 — to its own `relay-ip`, the container address the bridge shares, and every other peer is denied (`allowed-peer-ip` is that address alone). So relayed media never leaves the box, and the relay needs no port range of its own: only its listening port is published. Two relay-only participants in a 1:1 call can still go peer-to-peer, relay to relay, since each relay candidate carries that same public address.

Only UDP peer allocations are enabled (`no-tcp-relay`); TCP peer allocations would also expose the container's internal TCP services. Clients can still connect to TURN over UDP, TCP, or TLS.

The TURN Relay interface needs its **own public domain**, since StartOS will not serve one domain on two hosts. It serves plain TURN on UDP and TCP at 3479, and TURN over TLS that StartOS terminates at the domain on 443 — the same port, and the same certificate authority, as any HTTPS domain on the server — before forwarding plaintext to Coturn.

## Installation and First-Run Flow

Install generates the internal credentials and raises a `critical` task for the admin password. There is no wizard.

If you intend to use Jitsi over the internet, give the **Web UI** interface a clearnet public domain, enable a public IPv4 address on the **Video Bridge Media** interface, and give the **TURN Relay** interface a public domain of its own. StartOS states the gateway rules each of those requires; the media rule has to cover UDP. Without the relay, Jitsi still works for every participant who can reach the bridge directly.

## Actions

One action, which renames itself to match what running it will do.

### Create / Reset Admin Password

Sets the password for the `admin` account that is allowed to start meetings.

- **What it changes:** registers or overwrites that account in prosody's own account store, and records the password in `store.json`.
- **How:** in a temporary container, rendering a throwaway prosody config from the same templates the running container uses — the live config is generated under `/run` and is not reachable from outside it.
- **Cost:** seconds. Runnable running or stopped.
- **Repeat safety:** safe to re-run; the registration overwrites the existing account, and each run generates a fresh password.
- **Confirmation:** once a password exists, StartOS asks before running, since the current password stops working.
- **Outputs:** the username `admin` and the new password, masked and copyable.

Guests do not need this. It is required only to **start** a meeting; anyone with the link can join one already running.

## Tasks

One task, raised at install, and it blocks the service until you clear it.

| Task                  | Severity   | Raised when                             | Cleared when    |
| --------------------- | ---------- | --------------------------------------- | --------------- |
| Create Admin Password | `critical` | At init, while no admin password is set | The action runs |

`critical` because without it there is no account able to start a meeting, and the alternative — leaving meeting creation open — is not a safe default for a server reachable from the internet.

## Health Checks

Five daemon checks, plus standalone checks for the bridge's and the relay's public addresses.

| Check                | Displayed              | Method                                 | Grace |
| -------------------- | ---------------------- | -------------------------------------- | ----- |
| `prosody`            | "XMPP Server"          | Prosody's port is listening            | 30s   |
| `web`                | "Web Interface"        | The UI port is listening               | —     |
| `jicofo`             | "Conference Focus"     | Its own health endpoint                | —     |
| `jvb`                | "Video Bridge"         | Its port is listening                  | —     |
| `coturn`             | "TURN Relay"           | The relay port is listening            | —     |
| `jvb-public-address` | "Video Bridge Address" | Which address the bridge can advertise | —     |
| `turn-address`       | "TURN Relay Address"   | Whether the relay has a public domain  | —     |

**`jvb-public-address` is where the media-address problem surfaces**, and it reports all three states rather than only the broken one:

- **success** — a public IPv4 is published on the media interface, and that is what the bridge advertises.
- **failure** — the web UI is reachable on clearnet while the media interface has no public IPv4: meetings connect and carry no media. The message names the interface to fix. While failing it polls every 5 seconds instead of 30, so it clears promptly once the address is enabled.
- **disabled** — the web UI has no clearnet address, and the bridge is reachable only on the local network. This is the ordinary state of a purely local or Tor-only setup.

Because STUN is disabled, a bridge with no published address advertises no public candidate at all rather than a wrong one — there is no silent middle state in which the bridge advertises an address StartOS never published.

**`turn-address` reports the relay the same way**: success once the TURN Relay interface has an enabled public domain serving both plain TURN and TURN over TLS; failure when the web UI is on clearnet and the relay is not; disabled otherwise. `coturn` exists only while the relay has a domain, since Coturn needs one for its realm.

**`prosody` failing takes everything with it**, since the other three authenticate against it; its 30-second grace covers account migration on first start.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. No dump step and nothing excluded.

- **Included:** the XMPP accounts, every component's seed configuration, `store.json` with every credential, and the relay's rendered config.
- **Restore:** complete. The admin account and password come back together, so no task is raised.

## Limitations and Differences

1. **A password is required before the service will start.** Meeting creation is authenticated; joining is not.
2. **Media needs its own public address, and so does the UI.** Exposing only the web UI produces calls that connect and then carry nothing — the bridge never falls back to a STUN-discovered address, and the relay can reach the bridge only at its published public IPv4. Exposing only the media interface leaves remote guests unable to load the client or reach signaling, both of which come from the web interface. Media is **UDP only** — nothing listens on TCP 10000, and StartOS's TCP-based reachability check may therefore report it closed even when media works.
3. **TURN is only advertised when the TURN Relay interface has a public domain.** Without it, calls work only where a direct connection is possible.
4. **The XMPP websocket transport is disabled** and the client uses BOSH, because the websocket URL is always generated as an absolute address that would not be reachable.
5. **TLS is terminated by StartOS**, so the web container serves plain HTTP.
6. **The relay serves only this Jitsi.** It cannot be used as a general TURN server by other apps; install the Coturn package for that.
7. **No riscv64 build.** x86_64 and aarch64 only.

---

## Quick Reference for AI Consumers

```yaml
package_id: jitsi
image: ghcr.io/jitsi/web # plus jitsi/prosody, jitsi/jicofo, jitsi/jvb, coturn/coturn
architectures:
  - x86_64
  - aarch64
subcontainers:
  - web-sub # nginx and the client
  - prosody-sub # XMPP server
  - jicofo-sub # conference focus
  - jvb-sub # video bridge
  - coturn-sub # TURN relay
volumes:
  main: per-component subpaths → /config, prosody accounts → /var/lib/prosody/data, store.json at the root, coturn/ → /var/lib/coturn
file_models:
  - store.json
  - coturn/turnserver.conf
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
  - COLIBRI_REST_ENABLED
  - JVB_ADVERTISE_PRIVATE_CANDIDATES
  - JVB_DISABLE_STUN
  - JVB_ADVERTISE_IPS # when a public IPv4 or global IPv6 is published
  - DISABLE_HTTPS
  - BOSH_RELATIVE
  - ENABLE_XMPP_WEBSOCKET
  - XMPP_BOSH_URL_BASE
  - TURN_CREDENTIALS # when the TURN Relay has a public domain
  - TURN_TRANSPORT # when the TURN Relay has a public domain
  - STUN_HOST # when the TURN Relay has a public domain
  - STUN_PORT # when the TURN Relay has a public domain
  - TURN_HOST # when the TURN Relay has a public domain
  - TURN_PORT # when the TURN Relay has a public domain
  - TURNS_HOST # when the TURN Relay has a public domain
  - TURNS_PORT # when the TURN Relay has a public domain
dependencies: []
interfaces:
  ui: { type: ui, port: 8000 }
  jvb-media: { type: api, port: 10000 }
  turn: { type: api, port: 3479, tls_port: 443 }
actions:
  - reset-password # renames itself to "Create Admin Password" when unset
tasks:
  - { action: reset-password, severity: critical }
health_checks:
  - prosody # displayed "XMPP Server"
  - web # displayed "Web Interface"
  - jicofo # displayed "Conference Focus"
  - jvb # displayed "Video Bridge"
  - coturn # displayed "TURN Relay"; only while the relay has a domain
  - jvb-public-address # displayed "Video Bridge Address"; success / failure / disabled per published address
  - turn-address # displayed "TURN Relay Address"; success / failure / disabled
```
