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

A guest joining from somewhere else needs two separate things from your server: the meeting page and its signaling, which come from the **Web UI** interface, and the audio and video itself, which the **Video Bridge Media** interface carries directly. Both have to be reachable, so set up all three of the following:

1. **Add a clearnet public domain to the Web UI interface.** Guests load the Jitsi Meet client from it _and_ do all their XMPP signaling through it, so without a public domain they can't open the meeting link, let alone join the room. Use a real domain rather than a bare IP address: browsers only grant camera and microphone access on a secure page, and a domain is what lets StartOS serve the UI over trusted TLS on port 443.
2. **Turn on a public IPv4 address for the Video Bridge Media interface**, and forward **UDP** port 10000 to your server. This is the path the media takes. Nothing listens on TCP 10000 — StartOS checks port reachability with a TCP connection, so it may report 10000 as closed even when your UDP forward is working correctly.
3. **Install the Coturn package** (StartOS prompts for it as a dependency) and give it a public domain, so participants behind restrictive NAT or firewalls can fall back to a relay. Coturn needs its own forwards: ports 3478 TCP and UDP, 5349 TCP for TLS, and the relay range 42000-42499 UDP. Jitsi picks up Coturn's address and shared secret automatically.

Without these, Jitsi still works for participants on your local network. Tor is not a substitute — Tor Browser disables WebRTC and Tor can't carry the UDP media a call needs, so guests can't join a meeting over it.

## Using Jitsi Meet

### Actions

- **Reset Admin Password** — generate a new admin password (shown once). Use it to rotate the password or recover if you've lost it.
