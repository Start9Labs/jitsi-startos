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

Startup is ordered: `prosody` first, then `web`, `jicofo`, and `jvb` alongside it. Oneshots run before their daemons — `nginx-patch` writes a longer proxy timeout so long-lived BOSH connections are not cut, and `prosody-chown` and `coturn-chown` hand their directories to the unprivileged user each image runs as, since StartOS mounts volumes root-owned. While Recording is on, `main` itself runs the certificate step of `recorderSetupExec` in the prosody container and publishes the recorder's credentials before any daemon starts; while it is off, the `recorder-setup` oneshot deletes Jibri's two accounts after `prosody-chown` and before `prosody` (see [Recording](#recording)). `coturn` and `coturn-chown` exist only while the TURN Relay interface has an enabled public domain.

## Volume and Data Layout

Two volumes: `main`, subdivided per component, and `public`, which holds only what a Jibri on this server reads. Each image reads its seed configuration from `/config` and treats it as read-only.

| Volume   | Mounted at                                                     | Purpose                                           |
| -------- | -------------------------------------------------------------- | ------------------------------------------------- |
| `main`   | `prosody/` → `/config`, plus a subpath at `/var/lib/prosody`   | XMPP accounts and prosody's seed configuration    |
| `main`   | `prosody-plugins-custom/` → `/prosody-plugins-custom`          | Prosody modules you add yourself                  |
| `main`   | one subpath each → `/config` in `web`, `jicofo`, `jvb`         | Their seed configuration                          |
| `main`   | `coturn/` → `/var/lib/coturn`                                  | `turnserver.conf`, rendered on every start        |
| `main`   | root                                                           | `store.json`                                      |
| `public` | Jitsi's own JS only; a Jibri on this server mounts `recorder/` | The recorder's credentials, while Recording is on |

Prosody's **certificate for `auth.meet.jitsi`** is kept at `prosody/certs/` on the volume once Recording has been on. The image generates any certificate it does not find under `/run` at every start, so without this the certificate an external Jibri pins would change on each restart; the image copies `/config` over `/run` first, so the kept one is used instead. One is created when `prosody/certs/` holds no `auth.meet.jitsi` certificate and key, or holds one that is not marked `CA:FALSE` (an older image's could sign other certificates): self-signed, valid ten years, for that one name. A recorder pins it by its SHA-256 fingerprint, so replacing it means giving every recorder on another server new connection details. Every other certificate prosody uses, `meet.jitsi`'s among them, comes from `prosody/certs/` when one is there and is otherwise generated on each start. Root first makes `/config` its own with mode 755 (an install that came through the `2.0.11146:2` migration has it owned by the image's user, who could otherwise swap `certs` for a link after the check), then refuses a `certs` that is a link, creates that folder, and hands it and the two files to the image's user without following a link; the certificate is written and its key made private as that user.

Prosody's **accounts** live at `/var/lib/prosody/data`, on their own subpath, rather than under `/config`. Upstream generates prosody's live configuration under `/run` and treats `/config` as a seed, so account data placed there would not survive a restart. Upstream moved `data_path` into the `data/` subdirectory in `stable-11146-2` and migrates only from the `/config` seed, so the `2.0.11146:2` migration moves accounts written by earlier releases across.

**Your own Prosody modules** go in `/prosody-plugins-custom`, in the `prosody-sub` container. Upstream's configuration lists that directory first in `plugin_paths` and the image ships nothing there, so it is empty until you add a file. The folder stays root-owned, and `prosody-chown` leaves it alone, because prosody only needs to read it. A module file must therefore be readable by everyone (mode `0644`, which writing it as root with `cat >` produces). One that prosody cannot read is reported in its log as `No such file or directory`, as if it were missing.

## File Models

Two models: the package's credentials and settings, and the relay's configuration.

| File                     | Format | Modelled                  | Written by                                |
| ------------------------ | ------ | ------------------------- | ----------------------------------------- |
| `store.json`             | JSON   | Yes — `FileHelper.json`   | Install, every init, and four actions     |
| `coturn/turnserver.conf` | text   | Yes — `FileHelper.string` | Every start, while the relay has a domain |

| Key                         | Set by                     | Notes                                                                                      |
| --------------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| `JICOFO_AUTH_PASSWORD`      | Install                    | Internal; how the conference focus authenticates to XMPP                                   |
| `JVB_AUTH_PASSWORD`         | Install                    | Internal; how the video bridge authenticates to XMPP                                       |
| `TURN_SECRET`               | First init                 | Internal; the relay's shared secret, from which prosody mints short-lived TURN credentials |
| `ADMIN_PASSWORD`            | The password action        | Yours; the credential for starting a meeting                                               |
| `XMPP_MODULES`              | The Prosody Modules action | Yours; additional modules for the main and guest virtual hosts                             |
| `XMPP_MUC_MODULES`          | The Prosody Modules action | Yours; additional modules for the conference room component                                |
| `XMPP_SPEAKERSTATS_MODULES` | The Prosody Modules action | Yours; additional modules for the speaker stats component                                  |
| `ENABLE_RECORDING`          | The Recording action       | Whether Jibri's accounts exist and the recording variables are set; off by default         |
| `RECORDING_REMOTE`          | The Recording action       | Whether the Recorder XMPP interface is exported for a Jibri on another server              |
| `ENABLE_LIVESTREAMING`      | The Recording action       | Whether the client offers live streaming through Jibri                                     |
| `JIBRI_XMPP_PASSWORD`       | First init, rotation       | Jibri's control account, `jibri@auth.meet.jitsi`                                           |
| `JIBRI_RECORDER_PASSWORD`   | First init, rotation       | Jibri's recorder account, `recorder@hidden.meet.jitsi`                                     |

The internal credentials are generated once and never shown — nothing asks for them and nothing displays them. The two Jibri passwords are the exception: a recorder on another server needs them, so Recorder Connection Details displays them. They are generated on the first init whether or not Recording is ever turned on, and change only through Rotate Recorder Passwords: prosody creates each account only if it is missing and keeps the password it was created with, so that action re-registers the accounts itself while Recording is on, and with it off deletes them so they are recreated from the new passwords.

While Recording is on, `main` writes `recorder/credentials.json` on the `public` volume — both passwords and the certificate's SHA-256 fingerprint — for a Jibri on this server to mount read-only; while it is off, the file is deleted. Nothing else is on that volume, and it is not backed up, since `main` rewrites it on every start.

The three module lists are empty until the action sets them. Each name must be lowercase letters, digits and underscores, because upstream's templates paste the names into prosody's Lua configuration: the action refuses any other name, and a list holding one after a hand edit is read as empty.

**No configuration file reaches the Jitsi components** — the relay's `turnserver.conf` is the one file this package renders. Every Jitsi component is configured by environment, composed on each start, and that is where this package's overrides live:

| Variable                           | Value                                                  | Why it differs from upstream's compose deployment                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ENABLE_AUTH`, `AUTH_TYPE`         | on, internal                                           | Only an authenticated user can start a meeting                                                                                                                                           |
| `ENABLE_GUESTS`                    | on                                                     | Anyone with the link can join one that has started                                                                                                                                       |
| `DISABLE_HTTPS`                    | on                                                     | StartOS terminates TLS at the edge                                                                                                                                                       |
| `BOSH_RELATIVE`                    | on                                                     | A relative BOSH URL works from any address — `.local`, clearnet, or Tor — without the client knowing the public hostname                                                                 |
| `ENABLE_XMPP_WEBSOCKET`            | off                                                    | The websocket URL has no relative form and would be generated as an unreachable absolute address; disabling it makes the client use BOSH                                                 |
| `JAVA_TOOL_OPTIONS`                | `-XX:-UseBASE64Intrinsics` (Jicofo and JVB)            | Mitigates CVE-2026-114938 (Java4Shell) on affected x86-64 processors with AVX-512 VBMI; upstream's own JVM options still apply                                                           |
| `JVB_ADVERTISE_PRIVATE_CANDIDATES` | on                                                     | Off, the bridge withholds every private address from browsers, the published LAN ones included, so a meeting without a public IPv4 carries no media                                      |
| `JVB_ADVERTISE_IPS`                | the published IPv4s and global IPv6s, with their ports | Static mappings use StartOS's enabled IP/port pairs: public, LAN and VPN alike                                                                                                           |
| `JVB_DISABLE_STUN`                 | on                                                     | Upstream's STUN mapping harvester is additive and would advertise whatever the box's default route exits from — a VPN exit, an upstream NAT — beside or instead of the published address |
| `TURN_*`, `STUN_*`, `TURNS_*`      | the TURN Relay interface                               | Set only when the TURN Relay interface has an enabled public domain                                                                                                                      |
| `XMPP_*_MODULES`                   | the lists in `store.json`                              | `XMPP_MODULES`, `XMPP_MUC_MODULES` and `XMPP_SPEAKERSTATS_MODULES`, each set only while its list is not empty; upstream's templates add the names to what they already enable            |
| `ENABLE_RECORDING`                 | on (Prosody, Jicofo, web)                              | Set only while the Recording action is on: Prosody registers Jibri's accounts, Jicofo watches the brewery, the client offers server-side recording                                       |
| `JIBRI_*_USER`                     | `jibri`, `recorder` (Prosody)                          | Set only while the Recording action is on; the images' defaults, passed so the details action cannot disagree                                                                            |
| `JIBRI_*_PASSWORD`                 | from `store.json` (Prosody)                            | Set only while the Recording action is on; the two Jibri accounts' passwords                                                                                                             |
| `ENABLE_LIVESTREAMING`             | on (web)                                               | Set only while Recording and Live streaming are on, with the stream-key validator widened to accept an RTMP(S) URL                                                                       |
| `JIBRI_BREWERY_MUC`                | `jibribrewery` (Jicofo)                                | Set only while the Recording action is on; the image's default. Prosody and the web image read no brewery name                                                                           |

`XMPP_HIDDEN_DOMAIN` is never set: every image defaults it to `hidden.meet.jitsi`, the domain the recorder account lives on.

Allowing private candidates also lets JVB offer the container's own host candidates, independently of `JVB_ADVERTISE_IPS`. Those are not additional published addresses or gateway forwards; browsers that cannot route to them use a reachable mapped candidate instead.

## Dependencies

None. The TURN relay is bundled.

## Network Access and Interfaces

Three interfaces, and a fourth while recorders on other servers are allowed. The first two are what a call needs; the third is the fallback for participants who cannot reach the bridge.

| Interface          | Id          | Type | Port                         | Description                                          |
| ------------------ | ----------- | ---- | ---------------------------- | ---------------------------------------------------- |
| Web UI             | `ui`        | ui   | 8000                         | The Jitsi Meet client                                |
| Video Bridge Media | `jvb-media` | api  | 10000                        | The WebRTC media transport                           |
| TURN Relay         | `turn`      | api  | 3479; TLS on 443 at a domain | The TURN relay                                       |
| Recorder XMPP      | `xmpp`      | api  | 5222                         | Prosody's client port, for a Jibri on another server |

**Neither interface is sufficient alone.** The web interface serves the client and proxies all of its XMPP signaling at `/http-bind` — `BOSH_RELATIVE` keeps that on whichever origin the page was loaded from; the media interface carries only WebRTC media. So a public media address with a LAN-only UI leaves remote guests unable to load the page or join the room at all, and a clearnet-reachable UI with no public address on the media interface produces meetings that join and then carry no audio or video. The `jvb-public-address` health check detects the second combination and reports it; see [Health Checks](#health-checks).

The web interface needs a **public domain**, not a bare IP: a public IPv4 on it is still served over HTTPS, but under the StartOS root CA, so every guest lands on a certificate warning; the domain is what StartOS terminates trusted TLS for on 443. The media interface needs a public IPv4, and its transport is **UDP only** — JVB's ICE/TCP is off by default and the image exposes no switch for it, so nothing listens on TCP 10000. StartOS's own port reachability check is a TCP connect, so it can report 10000 as closed while UDP media works.

**The TURN relay can relay only to the bridge.** Coturn rewrites a relay peer equal to its `external-ip` — the bridge's published IPv4 — to its own `relay-ip`, the container address the bridge shares, and every other peer is denied (`allowed-peer-ip` is that address alone). So relayed media never leaves the box, and the relay needs no port range of its own: only its listening port is published. Two relay-only participants in a 1:1 call can still go peer-to-peer, relay to relay, since each relay candidate carries that same public address.

Only UDP peer allocations are enabled (`no-tcp-relay`); TCP peer allocations would also expose the container's internal TCP services. Clients can still connect to TURN over UDP, TCP, or TLS.

The TURN Relay interface needs its **own public domain**, since StartOS will not serve one domain on two hosts. It serves plain TURN on UDP and TCP at 3479, and TURN over TLS that StartOS terminates at the domain on 443 — the same port, and the same certificate authority, as any HTTPS domain on the server — before forwarding plaintext to Coturn.

**Recorder XMPP is bound while Recording is on, and exported only while "Allow recorders on other servers" is on too.** Bound but not exported, it is reachable only at its bridge address, which is how a Jibri on this server connects. Exported, it is on the LAN. Turning either off disables or unexports the binding, which keeps its port and the address choices made on it. It is raw TCP with no TLS leg from StartOS: Prosody requires STARTTLS on this port itself. It lives on its own host, `xmpp-multi`, so a domain added to any other interface never reaches it, and StartOS leaves a public IP address off until it is switched on. Nothing in the package can stop a public address being enabled on it, so the `xmpp-exposure` health check fails while one is (see [Health Checks](#health-checks)). The port StartOS assigns need not be 5222; Recorder Connection Details reads the one it did.

**The two Jibri passwords are the real boundary, and the private port is defence in depth.** Jibri's browser joins meetings through the Web UI like any guest, then signs in as the recorder over the same public BOSH endpoint, so the recorder account is reachable wherever the Web UI is. That account joins any room past its lobby and password to record it without showing up as a participant; by default everyone in the meeting still sees that a recording is running. The control account is a full Jitsi and Prosody administrator, with access to every meeting's audio and video (it can, for one, join the bridge brewery and be taken by Jicofo as a video bridge), so treat its password as root-equivalent for this Jitsi. Both accounts exist only while Recording is on, and a Jibri dials in to Prosody; Jitsi never connects to a Jibri. Anyone who can reach the XMPP port can also try the guest domain's anonymous sign-in, as anyone reaching the Web UI already can.

## Installation and First-Run Flow

Install generates the internal credentials and raises a `critical` task for the admin password. There is no wizard.

If you intend to use Jitsi over the internet, give the **Web UI** interface a clearnet public domain, enable a public IPv4 address on the **Video Bridge Media** interface, and give the **TURN Relay** interface a public domain of its own. StartOS states the gateway rules each of those requires; the media rule has to cover UDP. Without the relay, Jitsi still works for every participant who can reach the bridge directly.

## Actions

Five actions. The password action renames itself to match what running it will do.

### Create / Reset Admin Password

Sets the password for the `admin` account that is allowed to start meetings.

- **What it changes:** registers or overwrites that account in prosody's own account store, and records the password in `store.json`.
- **How:** in a temporary container, rendering a throwaway prosody config from the same templates the running container uses — the live config is generated under `/run` and is not reachable from outside it.
- **Cost:** seconds. Runnable running or stopped.
- **Repeat safety:** safe to re-run; the registration overwrites the existing account, and each run generates a fresh password.
- **Confirmation:** once a password exists, StartOS asks before running, since the current password stops working.
- **Outputs:** the username `admin` and the new password, masked and copyable.

Guests do not need this. It is required only to **start** a meeting; anyone with the link can join one already running.

### Prosody Modules

Sets which additional Prosody modules are loaded, in three lists: one for the main and guest virtual hosts, one for the conference room component, and one for the speaker stats component.

- **When to run it:** to load a module upstream ships but does not enable, or one of your own placed in `/prosody-plugins-custom`. Add the file before naming it here.
- **What it changes:** the three lists in `store.json`, and nothing in prosody's accounts or seed configuration. The form opens with the current lists, and saving replaces all three.
- **Cost:** the change to `store.json` restarts every daemon when the service is running, which ends any meeting in progress. Nothing restarts while it is stopped.
- **Repeat safety:** safe to re-run; saving lists identical to those already in `store.json` writes nothing and restarts nothing.
- **What happens next:** prosody loads each named module at start. A name with no matching `mod_<name>.lua` in prosody's plugin directories is reported as an error in the prosody log, and prosody starts without it.
- **Outputs:** none.

A module runs inside prosody with full access to every meeting's signaling, so load only code you trust. Removing a name from a list stops loading that module; the files in `/prosody-plugins-custom` stay where they are.

The lists decide only which **new** names load. Because `/prosody-plugins-custom` comes first in `plugin_paths`, a file there named after a module the image already enables (`mod_speakerstats_component.lua`, for example) replaces that module on the next start, whether or not its name is in a list. Removing the file, not the name, undoes that.

Replacing a module's file does not restart anything, and neither does saving the action without changing a list. Restart Jitsi Meet to load the new file.

### Recording

Three switches, kept in `store.json` under the variable each sets.

- **Recording** (`ENABLE_RECORDING`): creates Jibri's two accounts, binds Recorder XMPP for a Jibri on this server, publishes `recorder/credentials.json`, and sets the recording variables above. Off, the variables, the binding and the credentials file are gone, and the `recorder-setup` oneshot deletes both accounts from Prosody's store before Prosody starts, so neither password signs in. It deletes the account files directly, every store Prosody keeps for each user: `prosodyctl` in this image deletes a user only through a running Prosody, and the recorder's `hidden.meet.jitsi` virtual host is not configured while recording is off. On again, the image's `register-setup` recreates both accounts from the passwords in `store.json`, so every recorder keeps working.
- **Allow recorders on other servers** (`RECORDING_REMOTE`): exports the binding as the Recorder XMPP interface, enables Recorder Connection Details, and adds the `xmpp-exposure` check.
- **Live streaming** (`ENABLE_LIVESTREAMING`): sets the web client's `ENABLE_LIVESTREAMING`, and its stream-key validator to accept a YouTube key or a full `rtmp://`/`rtmps://` URL, which Jibri streams to as given.
- **Cost:** saving a change restarts every daemon, which ends any meeting in progress. Saving without a change writes and restarts nothing.
- **Repeat safety:** safe. Off then on again brings back the same accounts, passwords and port.

### Recorder Connection Details

What a Jibri on another server needs. Disabled unless Recording and "Allow recorders on other servers" are both on; it changes nothing.

- **Connection string** (masked, copyable, QR): `jitsi-recorder:` followed by base64url JSON (`encodeRecorderConnection` in `startos/utils.ts`) holding every enabled private IPv4, `.local` or private-domain address of Recorder XMPP as `host:port` at the assigned port, every HTTPS address of the Web UI (its public domains if it has any, otherwise its other addresses except onions), both passwords, and the certificate's SHA-256 fingerprint. The Jibri service's Connect to Jitsi action takes it.
- **Jibri environment** (masked, copyable, downloadable as `jibri.env`): the same values as the variables Jibri's own Docker image reads, for a Jibri not on StartOS. The first address of each kind is set; the rest are listed as comments, since Jibri opens one connection per `XMPP_SERVER` entry. `XMPP_TRUST_ALL_CERTS` is `false`; Jibri's image defaults it to true.
- **XMPP certificate** (copyable, downloadable as `xmpp.crt`): Prosody's `auth.meet.jitsi` certificate, read from `prosody/certs/` without following a link and shown only if it is exactly one PEM certificate that parses, since that folder belongs to prosody's user. Mounted into a Docker Jibri's `/usr/local/share/ca-certificates/`, it is added to its trust store by `setup-custom-ca`.
- With no private address on Recorder XMPP, no HTTPS address on the Web UI, or no certificate yet, it says which and shows nothing.

### Rotate Recorder Passwords

Replaces both Jibri passwords with newly generated ones.

- **Availability:** always.
- **With Recording on:** it registers both new passwords with `prosodyctl register` (which overwrites, as the admin-password action relies on), in a temporary container with a throwaway config rendered with the recorder's virtual host, then saves both to `store.json` at once. A failed registration or save rereads `store.json` and attempts to reconcile both accounts with its passwords; a write can replace the file before reporting an error. Recovery restarts Jitsi Meet if it is running to end existing sessions. Recovery failures are logged, and the original registration or save error is reported; resolve the storage error and run the action again if recovery fails.
- **With Recording off:** neither account should exist, so nothing is registered. It deletes the two account files (the same purge `recorder-setup` runs, for the case where Recording was switched off while Jitsi Meet was stopped) and saves both new passwords; `register-setup` creates both accounts from them when Recording is next on. If Recording was turned on while the action ran, it registers both new passwords and restarts Jitsi Meet if it is running.
- **Cost:** the save restarts Jitsi Meet once if it is running, which ends any meeting in progress and every session signed in with an old password. A Jibri on this server reads the new credentials file; one on another server stops signing in until it has the new connection details.
- **Repeat safety:** safe; each run generates fresh passwords.

## Tasks

One task, raised at install, and it blocks the service until you clear it.

| Task                  | Severity   | Raised when                             | Cleared when    |
| --------------------- | ---------- | --------------------------------------- | --------------- |
| Create Admin Password | `critical` | At init, while no admin password is set | The action runs |

`critical` because without it there is no account able to start a meeting, and the alternative — leaving meeting creation open — is not a safe default for a server reachable from the internet.

## Health Checks

Five daemon checks, plus standalone checks for the bridge's and the relay's public addresses, and for the recorder port's while recorders on other servers are allowed.

| Check                | Displayed               | Method                                     | Grace |
| -------------------- | ----------------------- | ------------------------------------------ | ----- |
| `prosody`            | "XMPP Server"           | Prosody's port is listening                | 30s   |
| `web`                | "Web Interface"         | The UI port is listening                   | —     |
| `jicofo`             | "Conference Focus"      | Its own health endpoint                    | —     |
| `jvb`                | "Video Bridge"          | Its port is listening                      | —     |
| `coturn`             | "TURN Relay"            | The relay port is listening                | —     |
| `jvb-public-address` | "Video Bridge Address"  | Which address the bridge can advertise     | —     |
| `turn-address`       | "TURN Relay Address"    | Whether the relay has a public domain      | —     |
| `xmpp-exposure`      | "Recorder XMPP Address" | Whether Recorder XMPP has a public address | —     |

**`jvb-public-address` is where the media-address problem surfaces**, and it reports all three states rather than only the broken one:

- **success** — a public IPv4 is published on the media interface, and that is what the bridge advertises.
- **failure** — the web UI is reachable on clearnet while the media interface has no public IPv4: meetings connect and carry no media. The message names the interface to fix. While failing it polls every 5 seconds instead of 30, so it clears promptly once the address is enabled.
- **disabled** — the web UI has no clearnet address, and the bridge is reachable only on the local network. This is the ordinary state of a purely local or Tor-only setup.

Because STUN is disabled, JVB does not discover extra public mappings through STUN. Its static mappings follow the media binding's enabled addresses and ports; container host candidates are offered separately.

**`turn-address` reports the relay the same way**: success once the TURN Relay interface has an enabled public domain serving both plain TURN and TURN over TLS; failure when the web UI is on clearnet and the relay is not; disabled otherwise. `coturn` exists only while the relay has a domain, since Coturn needs one for its realm.

**`xmpp-exposure` exists only while Recording and "Allow recorders on other servers" are both on.** It fails, naming the addresses (IPv6 in brackets), while Recorder XMPP has any enabled public IP, public domain, or plugin address such as an onion; waits, without claiming success, until the binding exists and has an enabled private address a recorder could dial; and succeeds once it does and nothing public is enabled. It reads the interface as it changes, without restarting anything, and polls every 5 seconds while failing. It fails closed: if the watch on the interface errors, the SDK stops watching, so the check fails from then on ("cannot read the Recorder XMPP addresses") until Jitsi Meet restarts, rather than keep the last answer.

**`prosody` failing takes everything with it**, since the other three authenticate against it; its 30-second grace covers account migration on first start.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. No dump step.

- **Excluded:** the `public` volume, which `main` rewrites on every start.
- **Included:** the `main` volume: the XMPP accounts, Jibri's among them, every component's seed configuration, your own Prosody modules, `store.json` with every credential and module list, and the relay's rendered config.
- **Restore:** complete. The admin account and password come back together, so no task is raised.

## Limitations and Differences

1. **A password is required before the service will start.** Meeting creation is authenticated; joining is not.
2. **Media needs its own public address, and so does the UI.** Exposing only the web UI produces calls that connect and then carry nothing — the bridge never falls back to a STUN-discovered address, and the relay can reach the bridge only at its published public IPv4. Exposing only the media interface leaves remote guests unable to load the client or reach signaling, both of which come from the web interface. Media is **UDP only** — nothing listens on TCP 10000, and StartOS's TCP-based reachability check may therefore report it closed even when media works.
3. **TURN is only advertised when the TURN Relay interface has a public domain.** Without it, calls work only where a direct connection is possible.
4. **The XMPP websocket transport is disabled** and the client uses BOSH, because the websocket URL is always generated as an absolute address that would not be reachable.
5. **TLS is terminated by StartOS**, so the web container serves plain HTTP.
6. **The relay serves only this Jitsi.** It cannot be used as a general TURN server by other apps; install the Coturn package for that.
7. **No riscv64 build.** x86_64 and aarch64 only.
8. **No recorder is bundled.** Recording needs the Jibri service, on this server or another, or a Jibri run elsewhere; recordings are saved where Jibri runs.

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
  main: per-component subpaths → /config, prosody accounts → /var/lib/prosody/data, your own prosody modules → /prosody-plugins-custom, the recorder's pinned certificate → prosody/certs/, store.json at the root, coturn/ → /var/lib/coturn
  public: recorder/credentials.json, for a Jibri on this server, while Recording is on
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
  - JAVA_TOOL_OPTIONS # Jicofo and JVB only; disables Base64 intrinsics
  - JICOFO_AUTH_USER
  - JICOFO_AUTH_PASSWORD
  - JVB_AUTH_USER
  - JVB_AUTH_PASSWORD
  - JVB_PORT
  - JVB_BREWERY_MUC
  - JVB_ADVERTISE_PRIVATE_CANDIDATES
  - JVB_DISABLE_STUN
  - JVB_ADVERTISE_IPS # the enabled IPv4s and global IPv6s of Video Bridge Media
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
  - XMPP_MODULES # when its list is not empty
  - XMPP_MUC_MODULES # when its list is not empty
  - XMPP_SPEAKERSTATS_MODULES # when its list is not empty
  - ENABLE_RECORDING # Prosody, Jicofo and web; while Recording is on
  - ENABLE_LIVESTREAMING # web; while Recording and Live streaming are on
  - ENABLE_LIVESTREAMING_VALIDATOR_REGEXP_STRING # web; with ENABLE_LIVESTREAMING
  - JIBRI_XMPP_USER # Prosody; while Recording is on
  - JIBRI_XMPP_PASSWORD # Prosody; while Recording is on
  - JIBRI_RECORDER_USER # Prosody; while Recording is on
  - JIBRI_RECORDER_PASSWORD # Prosody; while Recording is on
  - JIBRI_BREWERY_MUC # Jicofo; while Recording is on
dependencies: []
interfaces:
  ui: { type: ui, port: 8000 }
  jvb-media: { type: api, port: 10000 }
  turn: { type: api, port: 3479, tls_port: 443 }
  xmpp: { type: api, port: 5222, host: xmpp-multi } # bound while Recording is on; exported only with recorders on other servers allowed
actions:
  - reset-password # renames itself to "Create Admin Password" when unset
  - prosody-modules # additional Prosody modules to load
  - recording # restarts Jitsi when saved with a change
  - recorder-connection-details # disabled unless recorders on other servers are allowed
  - rotate-recorder-passwords # restarts Jitsi if running; a remote recorder needs new connection details
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
  - xmpp-exposure # displayed "Recorder XMPP Address"; only while recorders on other servers are allowed; fails on any public address
```
