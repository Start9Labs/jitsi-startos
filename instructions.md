# Jitsi Meet

## Documentation

- [Jitsi handbook](https://jitsi.github.io/handbook/) — upstream user, admin, and developer documentation for Jitsi Meet.

## What you get on StartOS

- A **Web UI** interface running the Jitsi Meet web client where you host and join meetings.
- A **Video Bridge Media** interface (UDP) for WebRTC audio and video transport.
- A **TURN Relay** interface that relays media for participants who can't reach the video bridge directly.
- All XMPP, signaling, and inter-component authentication is configured for you — only an admin account (used to create meetings) is needed.

## Getting set up

Jitsi posts a critical task after install. You can't start the service until it's done.

1. Run the **Create Admin Password** task. A username (`admin`) and a random password are generated and shown once — copy and save them before dismissing. If you lose the password, run the **Reset Admin Password** action later to set a new one.
2. Start Jitsi Meet.
3. Open the **Web UI**, sign in with the admin credentials to create a meeting, then share the meeting URL with guests. Guests don't need an account to join.

### For meetings over the public internet

A guest joining from somewhere else needs two separate things from your server: the meeting page and the room itself, which come from the **Web UI** interface, and the audio and video, which the **Video Bridge Media** interface carries directly. Both have to be reachable, so set up all three of the following:

1. **Add a clearnet public domain to the Web UI interface.** Guests load the meeting page from it and stay connected to the meeting through it, so without a public domain they can't open the meeting link, let alone join the room. Use a real domain rather than a bare IP address: it is what gets the meeting page a certificate your guests' browsers trust.
2. **Turn on a public IPv4 address for the Video Bridge Media interface.** This is the path the media takes, and it carries **UDP** only, so make sure the rule StartOS asks you for covers UDP. StartOS checks port reachability with a TCP connection, so it may report the port as closed even when media is working correctly.
3. **Add a public domain to the TURN Relay interface**, different from the Web UI's, and make sure both of its addresses are enabled. Participants behind restrictive NAT or firewalls relay their media through it: plain TURN over UDP and TCP, and TURN over TLS on port 443 for networks that allow nothing else. Treat this as required for meetings over the internet — without it, some guests can join a meeting and still get no audio or video.

Without these, Jitsi still works for participants on your local network. Tor is not a substitute — Tor Browser disables WebRTC and Tor can't carry the UDP media a call needs, so guests can't join a meeting over it.

The **Video Bridge Address** health check tells you which of these states you're in: green once the media interface has a public IPv4, red when the Web UI is on clearnet but the media interface isn't (meetings connect and carry no audio or video), and grey when the Web UI has no clearnet address. In the grey state the bridge is reachable only on your local network. The bridge's mapped addresses and ports follow what you enabled on Video Bridge Media — it never guesses a public mapping, so the check going grey is information, not a fault. It also offers internal container addresses as ICE candidates; browsers that cannot reach those use a reachable mapped address instead.

The **TURN Relay Address** check works the same way: green once the TURN Relay interface has a public domain with both addresses enabled, red when the Web UI is on clearnet but the relay isn't, and grey when the Web UI has no clearnet address.

## Using Jitsi Meet

### Actions

- **Reset Admin Password** — generate a new admin password (shown once). Use it to rotate the password or recover if you've lost it. It asks for confirmation first, because the current password stops working.
- **Prosody Modules** — choose additional Prosody modules to load. Most servers never need it; use it when an add-on's instructions name a module to enable. Saving restarts Jitsi Meet, which ends any meeting in progress.
- **Recording** — let a Jibri recorder you run on another machine record meetings on the server side. Off by default. Saving a change restarts Jitsi Meet, which ends any meeting in progress.
- **Recorder Connection Details** — show the settings and certificate that recorder needs. Available while Recording is on.
- **Rotate Recorder Passwords** — replace the recorder's two passwords. Saving them restarts Jitsi Meet if it is running (twice while Recording is on), and the recorder stops connecting until you give it the new passwords. With Recording off it deletes any leftover account files and replaces the stored passwords, restarting Jitsi Meet if it is running; the recorder's accounts are created with them when you turn Recording back on.

### Adding your own Prosody module

Prosody is the part of Jitsi Meet that handles sign-in and meeting rooms, and it can be extended with modules: Lua files named `mod_<name>.lua`. A module sees everything that passes through your meetings, so add only code you trust.

1. With Jitsi Meet running, copy the file into the `/prosody-plugins-custom` folder. From a computer with `start-cli` set up for your server:

   ```
   start-cli package attach jitsi -n prosody-sub -u root -- sh -c 'cat > /prosody-plugins-custom/mod_example.lua' < mod_example.lua
   ```

2. Run the **Prosody Modules** action and add the module's name, without `mod_` or `.lua` (here, `example`), to the list its instructions name: virtual host, conference room, or speaker stats.
3. Save. Jitsi Meet restarts and loads the module.

To stop loading a module, remove its name from the list and save. The file stays in the folder, and the folder is part of your backups.

If you later replace a module's file with a newer copy, restart Jitsi Meet yourself from its service page. Saving the action without changing a list does not restart it, so the old copy keeps running until you do.

### Recording meetings with Jibri

Jitsi Meet records through Jibri, a separate recorder that joins a meeting in a hidden browser and saves it as a video file. This service does not include one: you run Jibri on another computer, and recordings are saved there. Put that computer on the same local network as this server if you can; a path through a VPN hub works, but every hop is somewhere the connection could be watched.

1. Run the **Recording** action, turn on **External Recorder**, and save. Jitsi Meet restarts, and a **Recorder XMPP** interface appears.
2. Keep that interface on your private network. Leave its public addresses off and add no domain to it. The **Recorder XMPP Address** health check turns red if it has any public address, and waits until it has a private one.
3. Run **Recorder Connection Details**. Each value is named after the Jibri setting it fills: put them in a file named `.env` on the Jibri computer, one `NAME=value` per line, and make it readable only by you with `chmod 600 .env`, since it holds both passwords. Use an `XMPP_SERVER` address that the Jibri computer can reach, and a `PUBLIC_URL` whose certificate its browser trusts. Save the **XMPP certificate** value as `xmpp.crt` beside it, and keep `XMPP_TRUST_ALL_CERTS=false`: Jibri otherwise accepts any certificate, so anyone on the network path could pose as this server and capture the control password.
4. Start Jibri with the compose file below, in the same folder. Once it has connected, a moderator can start and stop a recording from the meeting's menu.

```yaml
# docker-compose.yml. Beside it: .env and xmpp.crt (step 3), logging.properties and jibri-run.sh
# (below), and a storage folder owned by the image's user: mkdir storage && sudo chown 1000:1000 storage
services:
  jibri:
    image: ghcr.io/jitsi/jibri:stable-11509-1
    restart: unless-stopped
    env_file: .env
    environment:
      XMPP_TRUST_ALL_CERTS: 'false'
      DISPLAY: ':0'
      JIBRI_INSTANCE_ID: jibri-1
    # No capabilities and nothing privileged. This works because /run is owned by the
    # image's user (uid 1000) from the start.
    read_only: true
    cap_drop: [ALL]
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /config:size=64k,mode=0755
      - /run:size=256M,mode=1750,exec,uid=1000,gid=1000
      - /tmp:size=256M,mode=1777,noexec
    # Jibri refuses to start with less.
    shm_size: '2gb'
    volumes:
      - ./storage:/storage # recordings land in storage/recordings
      - ./xmpp.crt:/usr/local/share/ca-certificates/jitsi-xmpp.crt:ro
      - ./logging.properties:/defaults/logging.properties:ro
      - ./jibri-run.sh:/etc/s6-overlay/scripts/jibri:ro
```

Jibri's default logging writes passwords to its logs. At start-up it prints both passwords. During a recording it opens the meeting with the recorder account's login in the page address; the browser driver logs that address to `storage/logs/chromedriver.log`, and at the end of each call Jibri copies the driver's log into `storage/logs/browser.N.txt`, so the recorder password lands in both. Make the two files the compose file mounts from the image's own, changing only that:

```bash
img=ghcr.io/jitsi/jibri:stable-11509-1
# Main logs at INFO (no start-up password dump); the browser log off.
docker run --rm --entrypoint cat $img /defaults/logging.properties \
  | sed -E -e 's/^(java\.util\.logging\.(File|Console)Handler\.level) = .*/\1 = INFO/' \
      -e 's/^(org\.jitsi\.jibri\.selenium\.util\.BrowserFileHandler\.level) = .*/\1 = OFF/' \
  > logging.properties
# Jibri's start script, with the browser driver's log sent to /dev/null.
docker run --rm --entrypoint cat $img /etc/s6-overlay/scripts/jibri \
  | sed -E 's#-Dwebdriver\.chrome\.logfile=[^ ]+#-Dwebdriver.chrome.logfile=/dev/null#' > jibri-run.sh
chmod 755 jibri-run.sh
# Both must print a count: 3, then 1. Anything else means the image changed; do not start Jibri.
grep -c -e '^java.util.logging.FileHandler.level = INFO$' -e '^java.util.logging.ConsoleHandler.level = INFO$' \
  -e '^org.jitsi.jibri.selenium.util.BrowserFileHandler.level = OFF$' logging.properties
grep -c -e '-Dwebdriver.chrome.logfile=/dev/null ' jibri-run.sh
```

Redo both files whenever you change the image tag. Never set `JIBRI_CHROMEDRIVER_DEBUG`: it makes the driver write the container's whole environment, both passwords included, to a log file inside the container. If you already ran Jibri without these files, delete `storage/logs/chromedriver.log` and the `browser.*.txt` and `log.*.txt` files there, and rotate the passwords if anyone else can read that folder.

**Keep the two passwords secret.** Jibri's browser signs in through the same web address your guests use, so the passwords protect it, not the private port. Anyone holding the recorder password can join any meeting to record it without showing up as a participant (by default everyone in the meeting still sees that a recording is running). The control password is worth more: that account is a full Jitsi and Prosody administrator with access to every meeting's audio and video, so treat it like a root password. Never give the Recorder XMPP interface a public address or domain. If a password may have leaked, run **Rotate Recorder Passwords** and update the recorder's `.env`.

Turning Recording off removes the interface and server-side recording, and deletes the recorder's two accounts, so neither password works while it is off. Turning it back on recreates them with the same passwords, so the Jibri side needs no change.

**Replacing the certificate.** The certificate is kept until you replace it, which is manual and needs a shell on the server: delete `auth.meet.jitsi.crt` and `auth.meet.jitsi.key` from the `prosody/certs/` folder of this service's main volume, restart Jitsi Meet with Recording on (it creates a new certificate), run **Recorder Connection Details**, save the new certificate as `xmpp.crt` on the Jibri computer, and restart Jibri. Do this if Recorder Connection Details says the certificate is not readable. Also consider it if your server ran an older version of this service that left a certificate there: that one is kept as it is and may be allowed to sign other certificates. `openssl x509 -in xmpp.crt -noout -ext basicConstraints` shows `CA:FALSE` for one this service created.
