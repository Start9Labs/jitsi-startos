# Jitsi Meet

## Documentation

- [Jitsi handbook](https://jitsi.github.io/handbook/) — upstream user, admin, and developer documentation for Jitsi Meet.

## What you get on StartOS

- A **Web UI** interface running the Jitsi Meet web client where you host and join meetings.
- A **Video Bridge Media** interface (UDP) for WebRTC audio and video transport.
- TURN/STUN relay for participants who can't reach the video bridge directly, provided by the separate **Coturn** package that Jitsi depends on.
- All XMPP, signaling, and inter-component authentication is configured for you — only an admin account (used to create meetings) is needed.

## Getting set up

Jitsi posts a critical task after install. You can't start the service until it's done.

1. Run the **Create Admin Password** task. A username (`admin`) and a random password are generated and shown once — copy and save them before dismissing. If you lose the password, run the **Reset Admin Password** action later to set a new one.
2. Start Jitsi Meet.
3. Open the **Web UI**, sign in with the admin credentials to create a meeting, then share the meeting URL with guests. Guests don't need an account to join.

### For meetings over the public internet

The video bridge moves WebRTC media directly between participants and your server, which requires a reachable public address on a couple of interfaces:

1. Add a clearnet public IPv4 to the **Video Bridge Media** interface so remote participants can send media to it.
2. Install the **Coturn** package (StartOS prompts for it as a dependency) and give it a public domain, so participants behind restrictive NAT or firewalls can fall back to TURN. Jitsi picks up Coturn's address and shared secret automatically.

LAN-only and Tor access to the Web UI work without these, but media for remote participants will not.

## Using Jitsi Meet

### Actions

- **Reset Admin Password** — generate a new admin password (shown once). Use it to rotate the password or recover if you've lost it.
