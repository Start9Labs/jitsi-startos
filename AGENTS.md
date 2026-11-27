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
`instructions.md` (end-user docs) in sync with your changes. This file restates neither:
whoever changes the package has both, so it carries only what they don't — repo mechanics,
a change that looks right and is not, where the next thing gets added, a naming trap, a
build or test invocation particular to this repo.

**Fix a defect you spot rather than reporting it** — you have the package open and the
context to be sure. File **a GitHub issue on this repo** only when the call isn't yours to
make: you can't pin the cause down, two defensible fixes exist, or it's too large to ride on
the work in hand. An open issue is a report, not a queue — implement one when you're asked
to or when it's labelled `Approved`, then close it with `Closes #<n>`.

Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **Keep Prosody's accounts on their own subpath at `/var/lib/prosody`.** Accounts written under `/config` are lost on the next restart.
- **Keep the relay's `external-ip` the bridge's published IPv4, `relay-ip` and the sole `allowed-peer-ip` the container address, and every other peer denied.** Relaying to the bridge works only through that rewrite, and a wider peer list makes it an open relay.
- **Don't re-enable the XMPP websocket (`ENABLE_XMPP_WEBSOCKET`) or STUN (`JVB_DISABLE_STUN`), and don't turn off private candidates (`JVB_ADVERTISE_PRIVATE_CANDIDATES`).** Each breaks calls in a way README's environment table describes; the last silences every meeting held without a public IPv4.
- **Read exposure that feeds only a health check with `.onChange`, not `.const()`.** A `.const()` read restarts every daemon each time an address is toggled.
- **Keep `prosodyModulePattern` on both the action's input and `store.json`'s shape.** Upstream's templates paste each module name between quotes in prosody's Lua configuration, so a looser pattern on either lets a name close the string.
- **Keep the recorder's XMPP port on its own `xmpp-multi` host, and change the Jibri passwords only through an action that re-registers them (Recording on) or deletes their account files first (Recording off).** A domain belongs to its host, so a binding on `ui-multi` would sit one switch away from the Web UI's public domain; and prosody's `register-setup` keeps the password an account was created with, so a new one written only to `store.json` locks Jibri out, and leaves the old one working if the account was never purged (Recording switched off while stopped).
- **Keep Jibri's accounts deleted while Recording is off, and the recorder's certificate on the volume.** The `jibri` account is a prosody admin that can sign in over public BOSH and join the bridge brewery as a fake video bridge; `prosodyctl` here deletes users only through a running prosody, hence the file-level purge in `recorderSetupExec`. A certificate left under `/run` is regenerated each start and breaks the recorder's pin. Root first takes `/config` back (`chown -h 0:0`, 755: the `2.0.11146:2` migration left it `s6`-owned, which lets `s6` swap `certs` for a link between the `-L` check and the `chown -h`), then only prepares `/config/certs` (`chown -h`, no `-R`); everything that writes inside it runs as `s6`, who owns the folder and can plant links in it, so Recorder Connection Details reads the certificate without following links and shows only a single parsed PEM certificate.
