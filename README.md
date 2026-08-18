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

Four upstream images, unmodified, each run as its container's init process.

| Property      | Value                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| Images        | `ghcr.io/jitsi/web`, `ghcr.io/jitsi/prosody`, `ghcr.io/jitsi/jicofo`, `ghcr.io/jitsi/jvb` |
| Architectures | x86_64, aarch64                                                                           |
| Entrypoint    | Each image's own, run as init                                                             |

| Subcontainer  | Purpose                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------- |
| `web-sub`     | nginx and the Jitsi Meet client — the `web` daemon, and the one to `attach` to for UI issues |
| `prosody-sub` | The XMPP server every other component authenticates against                                  |
| `jicofo-sub`  | The conference focus, which allocates a bridge per meeting                                   |
| `jvb-sub`     | The video bridge, which carries the actual media                                             |

Startup is ordered: `prosody` first, then `web`, `jicofo`, and `jvb` alongside it. Two oneshots run before their daemons — `nginx-patch` writes a longer proxy timeout so long-lived BOSH connections are not cut, and `prosody-chown` hands the account directory to the unprivileged user the image runs as, since StartOS mounts volumes root-owned.

## Volume and Data Layout

One volume, subdivided per component. Each image reads its seed configuration from `/config` and treats it as read-only.

| Volume | Mounted at                                                   | Purpose                                        |
| ------ | ------------------------------------------------------------ | ---------------------------------------------- |
| `main` | `prosody/` → `/config`, plus a subpath at `/var/lib/prosody` | XMPP accounts and prosody's seed configuration |
| `main` | one subpath each → `/config` in `web`, `jicofo`, `jvb`       | Their seed configuration                       |
| `main` | root                                                         | `store.json`                                   |

Prosody's **accounts** live at `/var/lib/prosody/data`, on their own subpath, rather than under `/config`. Upstream generates prosody's live configuration under `/run` and treats `/config` as a seed, so account data placed there would not survive a restart. Upstream moved `data_path` into the `data/` subdirectory in `stable-11146-2` and migrates only from the `/config` seed, so the `2.0.11146:2` migration moves accounts written by earlier releases across.

Coturn's shared secret is read through a **read-only mount of just the `shared` subpath** of Coturn's volume, into a throwaway container — never the volume root, and never into a running daemon.

## File Models

One model, holding three generated credentials.

| File         | Format | Modelled                | Written by                                   |
| ------------ | ------ | ----------------------- | -------------------------------------------- |
| `store.json` | JSON   | Yes — `FileHelper.json` | Install, every init, and the password action |

| Key                    | Set by     | Notes                                                    |
| ---------------------- | ---------- | -------------------------------------------------------- |
| `JICOFO_AUTH_PASSWORD` | Install    | Internal; how the conference focus authenticates to XMPP |
| `JVB_AUTH_PASSWORD`    | Install    | Internal; how the video bridge authenticates to XMPP     |
| `ADMIN_PASSWORD`       | The action | Yours; the credential for starting a meeting             |

The two internal credentials are generated once and never shown — nothing asks for them and nothing displays them.

**No configuration file reaches the applications.** Every component is configured by environment, composed on each start, and that is where this package's overrides live:

| Variable                           | Value                      | Why it differs from upstream's compose deployment                                                                                        |
| ---------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ENABLE_AUTH`, `AUTH_TYPE`         | on, internal               | Only an authenticated user can start a meeting                                                                                           |
| `ENABLE_GUESTS`                    | on                         | Anyone with the link can join one that has started                                                                                       |
| `DISABLE_HTTPS`                    | on                         | StartOS terminates TLS at the edge                                                                                                       |
| `BOSH_RELATIVE`                    | on                         | A relative BOSH URL works from any address — `.local`, clearnet, or Tor — without the client knowing the public hostname                 |
| `ENABLE_XMPP_WEBSOCKET`            | off                        | The websocket URL has no relative form and would be generated as an unreachable absolute address; disabling it makes the client use BOSH |
| `JVB_ADVERTISE_PRIVATE_CANDIDATES` | off                        | Bridge-internal addresses are unroutable for clients and can stall connection setup if offered                                           |
| `JVB_ADVERTISE_IPS`                | the published public IPv4s | The bridge advertises the addresses StartOS publishes rather than one discovered by STUN                                                 |
| `TURN_*`, `STUN_*`, `TURNS_*`      | derived from Coturn        | Set only when Coturn has a public domain and its secret is readable                                                                      |

## Dependencies

One, declared required, and reached in two different ways.

| Dependency | Kind      | Health checks | Mount                                  | Why                                  |
| ---------- | --------- | ------------- | -------------------------------------- | ------------------------------------ |
| Coturn     | `running` | none          | `shared` subpath, read-only, temporary | TURN/STUN relay for calls behind NAT |

**No health check is required deliberately.** Coturn's own check reports `disabled` until a public domain is attached to it, which would show as a permanent unmet-dependency warning here — while Jitsi in fact degrades gracefully, running without a relay. Coturn's own checks are what prompt the user to finish setting it up.

Jitsi reads two things from Coturn: its public TURN and TURNS addresses, resolved from Coturn's own interface, and its shared secret. Both must be available for the relay to be advertised; if either is missing, prosody is started without TURN and calls work only where a direct connection is possible.

## Network Access and Interfaces

Two interfaces, and both matter for a call to work.

| Interface          | Id          | Type | Port  | Description                |
| ------------------ | ----------- | ---- | ----- | -------------------------- |
| Web UI             | `ui`        | ui   | 8000  | The Jitsi Meet client      |
| Video Bridge Media | `jvb-media` | api  | 10000 | The WebRTC media transport |

**Exposing the web UI publicly is not enough.** Media does not flow through the web interface — it goes directly to the video bridge — so a publicly-reachable UI with no public address on the media interface produces meetings that join and then carry no audio or video. The bridge's health check detects exactly that combination and reports it; see [Health Checks](#health-checks).

## Installation and First-Run Flow

Install generates the two internal credentials and raises a `critical` task for the third. There is no wizard.

The ordering that matters is Coturn's: it should be installed **and given a public domain** before you rely on Jitsi for calls across networks, because that is what makes a relay available. Jitsi will start and work without it on a local network.

If you intend to use Jitsi over the internet, enable a public IPv4 address on the **Video Bridge Media** interface as well as on the web UI.

## Actions

One action, which renames itself to match what running it will do.

### Create / Reset Admin Password

Sets the password for the `admin` account that is allowed to start meetings.

- **What it changes:** registers or overwrites that account in prosody's own account store, and records the password in `store.json`.
- **How:** in a temporary container, rendering a throwaway prosody config from the same templates the running container uses — the live config is generated under `/run` and is not reachable from outside it.
- **Cost:** seconds. Runnable running or stopped.
- **Repeat safety:** safe to re-run; the registration overwrites the existing account, and each run generates a fresh password.
- **Outputs:** the username `admin` and the new password, masked and copyable.

Guests do not need this. It is required only to **start** a meeting; anyone with the link can join one already running.

## Tasks

One task, raised at install, and it blocks the service until you clear it.

| Task                  | Severity   | Raised when                             | Cleared when    |
| --------------------- | ---------- | --------------------------------------- | --------------- |
| Create Admin Password | `critical` | At init, while no admin password is set | The action runs |

`critical` because without it there is no account able to start a meeting, and the alternative — leaving meeting creation open — is not a safe default for a server reachable from the internet.

## Health Checks

Four checks, one per daemon.

| Check     | Displayed          | Method                                            | Grace |
| --------- | ------------------ | ------------------------------------------------- | ----- |
| `prosody` | "XMPP Server"      | Prosody's port is listening                       | 30s   |
| `web`     | "Web Interface"    | The UI port is listening                          | —     |
| `jicofo`  | "Conference Focus" | Its own health endpoint                           | —     |
| `jvb`     | "Video Bridge"     | Its port, plus whether it can be reached publicly | —     |

**`jvb` reports more than liveness.** After confirming the bridge is up, it fails if the web UI is publicly reachable while the media interface has no public IPv4 — the state in which meetings connect but carry no media. The message names the interface to fix. On a purely local setup neither is public and the check passes.

**`prosody` failing takes everything with it**, since the other three authenticate against it; its 30-second grace covers account migration on first start.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. No dump step and nothing excluded.

- **Included:** the XMPP accounts, every component's seed configuration, and `store.json` with all three credentials.
- **Restore:** complete. The admin account and password come back together, so no task is raised. Coturn must be installed and configured again on the restored server for relaying to work — its secret and domain are its own package's backup, not this one's.

## Limitations and Differences

1. **A password is required before the service will start.** Meeting creation is authenticated; joining is not.
2. **Media needs its own public address.** Exposing only the web UI produces calls that connect and then carry nothing.
3. **TURN is only advertised when Coturn has a public domain** and its secret is readable. Without it, calls work only where a direct connection is possible.
4. **The XMPP websocket transport is disabled** and the client uses BOSH, because the websocket URL is always generated as an absolute address that would not be reachable.
5. **TLS is terminated by StartOS**, so the web container serves plain HTTP.
6. **Coturn's health is deliberately not gated on.** An unconfigured Coturn does not stop Jitsi from running.
7. **No riscv64 build.** x86_64 and aarch64 only.

---

## Quick Reference for AI Consumers

```yaml
package_id: jitsi
image: ghcr.io/jitsi/web # plus jitsi/prosody, jitsi/jicofo, jitsi/jvb
architectures:
  - x86_64
  - aarch64
subcontainers:
  - web-sub # nginx and the client
  - prosody-sub # XMPP server
  - jicofo-sub # conference focus
  - jvb-sub # video bridge
volumes:
  main: per-component subpaths → /config, prosody accounts → /var/lib/prosody/data, store.json at the root
file_models:
  - store.json
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
  - JVB_ADVERTISE_IPS # when a public IPv4 is published
  - DISABLE_HTTPS
  - BOSH_RELATIVE
  - ENABLE_XMPP_WEBSOCKET
  - XMPP_BOSH_URL_BASE
  - TURN_CREDENTIALS # when Coturn is usable
  - TURN_TRANSPORT # when Coturn is usable
  - STUN_HOST # when Coturn is usable
  - STUN_PORT # when Coturn is usable
  - TURN_HOST # when Coturn is usable
  - TURN_PORT # when Coturn is usable
  - TURNS_HOST # when Coturn serves TLS
  - TURNS_PORT # when Coturn serves TLS
dependencies:
  - coturn # required; no health check gated, deliberately
interfaces:
  ui: { type: ui, port: 8000 }
  jvb-media: { type: api, port: 10000 }
actions:
  - reset-password # renames itself to "Create Admin Password" when unset
tasks:
  - { action: reset-password, severity: critical }
health_checks:
  - prosody # displayed "XMPP Server"
  - web # displayed "Web Interface"
  - jicofo # displayed "Conference Focus"
  - jvb # displayed "Video Bridge"; also reports a missing public media address
```
