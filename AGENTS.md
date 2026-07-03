# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `jitsi`.** Jitsi Meet is a multi-container service: five subcontainers off the `main` volume — `web-sub`, `prosody-sub`, `coturn-sub`, `jicofo-sub`, `jvb-sub`. The `web` daemon and the `nginx-patch` oneshot share the same `web-sub` instance.
- **Three interfaces, each on its own host** (host-id and interface-id constants exported from `startos/utils.ts`): `ui` (host `ui-multi`, the web UI), `jvb-media` (host `jvb-media-multi`, WebRTC media transport), and `turn` (host `turn-multi`, the TURN relay). `main.ts` reads each host with `sdk.host.getOwn` to advertise public addresses (JVB public IPv4s) and the TLS-wrapped TURN endpoint.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach jitsi -n web-sub -- <cmd>`. Select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — e.g. `web-sub`, `prosody-sub`, `coturn-sub`, `jicofo-sub`, `jvb-sub`) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".
