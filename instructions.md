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
