# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **Prosody's accounts must stay on their own subpath at `/var/lib/prosody`.** Upstream generates prosody's live config under `/run` and treats `/config` as a read-only seed, so accounts written there do not survive a restart.
- **`prosody-chown` covers `/config` as well as the storage path, and that is deliberate.** Releases before `2.0.11146` ran prosody as root, leaving the seed owned by uid 100 with modes uid 1000 cannot read — under which upstream's account migration and cert copy both fail _silently_, and the missing key is not regenerated because the matching `.crt` did copy. Don't narrow it.
- **Read Coturn's secret through the `shared` subpath only, read-only, in a throwaway container.** Never mount Coturn's volume root, and never mount it into a running daemon — a missing or broken Coturn must not be able to take prosody down.
- **Don't add a health check to the Coturn dependency.** Coturn's own `coturn` check reports `disabled` until a public domain is attached, which would surface here as a permanent unmet-dependency warning even though Jitsi degrades gracefully to relay-less operation. Coturn's own checks prompt the user.
- **`ENABLE_XMPP_WEBSOCKET` stays off and `BOSH_RELATIVE` stays on.** There is no relative form for the websocket URL — it is always generated as an absolute `wss://localhost:8443`, which no client can reach across `.local`, clearnet, and Tor. BOSH's relative URL works from every origin.
- **`JVB_ADVERTISE_IPS` comes from the published interface, not from STUN**, and `JVB_ADVERTISE_PRIVATE_CANDIDATES` stays off — bridge-internal 10.x and IPv6 ULA candidates are unroutable for clients and can stall ICE/DTLS when offered as high-priority pairs.
- **The password action renders a throwaway prosody config from the same templates.** The running container's config lives under `/run` and cannot be reached from a separate container, so `prosodyctl register` needs its own rendered copy pointed at the accounts on the storage volume.
