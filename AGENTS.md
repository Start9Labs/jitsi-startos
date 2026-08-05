# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `jitsi`.** Jitsi Meet is a multi-container service: four subcontainers off the `main` volume — `web-sub`, `prosody-sub`, `jicofo-sub`, `jvb-sub`. The `web` daemon and the `nginx-patch` oneshot share the same `web-sub` instance, and the `prosody` daemon and the `prosody-chown` oneshot share `prosody-sub`. (`main.ts` also spins up a throwaway `coturn-secret-read` container to read Coturn's shared secret, then destroys it.)
- **The upstream images run as the unprivileged `s6` user (uid 1000)**, which StartOS honours because the image's `USER` is captured into the s9pk at pack time. They treat `/config` as a read-only seed — each copies it into `/run` and generates its runtime config there. Nothing writes to `/config` at runtime, so its root ownership is fine, but the `nginx-patch` oneshot needs `user: 'root'` to seed `custom-meet.conf` into it. Prosody keeps XMPP accounts at `data_path` (`/var/lib/prosody`, the `prosody-storage` subpath) and aborts at startup unless that directory is writable by uid 1000 — hence `prosody-chown`.
- **`prosody-chown` covers `/config` as well as `/var/lib/prosody`, and that is load-bearing for upgrades.** Releases before `2.0.11146:0` ran prosody as root, so an existing volume has `prosody/data` at mode 0750 owned by uid 100 and `prosody/certs/*.key` at mode 0400. uid 1000 can read neither, and both failures are silent: upstream's `/config/data` → `/var/lib/prosody` account migration is skipped (losing the admin account) and the cert copy drops the private keys while the matching `.crt` still lands, which suppresses regeneration and leaves every virtual host without TLS. Port 5280 still answers, so the health check stays green throughout. Don't narrow that `chown` back to the storage path.
- **s6-overlay boots via a setuid-root `preinit`.** `/init` runs `s6-overlay-suexec`, which is setuid root, so `preinit` gets EUID 0 and `chown`s `/run` to uid 1000. StartOS mounts the subcontainer's overlay rootfs `rw` with no `nosuid`, so this works — verified on a real install. There is no tmpfs on `/run` here (that branch is for container managers that pre-mount it); if setuid were ever blocked, `preinit` would fail and all four containers would die at startup.
- **Two interfaces, each on its own host** (host-id and interface-id constants exported from `startos/utils.ts`): `ui` (host `ui-multi`, the web UI) and `jvb-media` (host `jvb-media-multi`, WebRTC media transport). `main.ts` reads each host with `sdk.host.getOwn` to advertise JVB's public IPv4s.
- **TURN/STUN comes from the external `coturn` package, not a bundled instance.** Jitsi declares a `running` dependency on `coturn`, discovers its public `turn`/`turns` endpoint via `sdk.host.get` (picking the plain vs TLS address by the `ssl` flag), and reads the shared secret by mounting Coturn's `main` volume at subpath `shared` (read-only). Prosody's `mod_external_services` advertises the endpoint to clients. If Coturn is absent or domainless, Jitsi runs relay-less.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach jitsi -n web-sub -- <cmd>`. Select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — e.g. `web-sub`, `prosody-sub`, `jicofo-sub`, `jvb-sub`) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".
