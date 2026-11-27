export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Jitsi Meet!': 0,
  'XMPP Server': 1,
  'The XMPP server is ready': 2,
  'The XMPP server is not ready': 3,
  'Web Interface': 4,
  'The web interface is ready': 5,
  'The web interface is not ready': 6,
  'Conference Focus': 7,
  'The conference focus is ready': 8,
  'The conference focus is not ready': 9,
  'Video Bridge': 10,
  'The video bridge is ready': 11,
  'The video bridge is not ready': 12,

  'Video Bridge Address': 41,
  'The video bridge advertises its published public IPv4.': 42,
  'Required for clearnet. Enable a public IPv4 address in the "Video Bridge Media" interface.': 38,
  'No public IPv4 published. The video bridge is reachable only on your local network.': 43,

  'TURN Relay': 45,
  'The TURN relay is ready': 47,
  'The TURN relay is not ready': 48,
  'TURN Relay Address': 49,
  'TURN and TURN over TLS are published on a public domain.': 50,
  'Required for clearnet. Add a public domain to the "TURN Relay" interface and enable both of its addresses.': 51,
  'The TURN relay has no public domain.': 52,

  // interfaces.ts
  'Web UI': 16,
  'The web interface of Jitsi Meet': 17,
  'Video Bridge Media': 18,
  'WebRTC media transport for video and audio': 19,
  'Relays media for participants who cannot reach the video bridge directly': 46,

  // init
  'Create an admin password so only you can start meetings.': 27,

  // actions (auth)
  'Reset Admin Password': 28,
  'Create Admin Password': 29,
  'Reset the administrator password for creating meetings': 30,
  'Create the administrator password for creating meetings': 31,
  Success: 32,
  'Your admin password has been set. Use these credentials to create meetings.': 33,
  Username: 34,
  Password: 35,
  'The current admin password stops working and is replaced by a newly generated one.': 44,

  // actions (prosody modules)
  'Prosody Modules': 53,
  'Choose additional Prosody modules to load. Saving restarts Jitsi Meet if it is running, which ends any meeting in progress.': 54,
  'Virtual Host Modules': 55,
  'Loaded on the main and guest virtual hosts.': 56,
  'Conference Room Modules': 57,
  'Loaded on the conference room component.': 58,
  'Speaker Stats Modules': 59,
  'Loaded on the speaker stats component.': 60,
  'Lowercase letters, digits and underscores only, without the "mod_" prefix or the ".lua" ending.': 61,

  // recording (external Jibri)
  'Recorder XMPP Address': 62,
  'The recorder XMPP port is published beyond your private network, at ${addresses}. Disable those addresses on the "Recorder XMPP" interface.': 63,
  'The recorder XMPP port is published on private addresses only.': 64,
  'Recorder XMPP': 65,
  'XMPP for an external Jibri recorder. Keep it on your private network.': 66,
  Recording: 67,
  'Let an external Jibri recorder record meetings. Saving a change restarts Jitsi Meet if it is running, which ends any meeting in progress.': 68,
  'External Recorder': 69,
  "Publishes an XMPP port on your private network for a Jibri recorder you run elsewhere, and adds server-side recording through it. Run Recorder Connection Details for the settings Jibri needs. Turning it off deletes the recorder's accounts; turning it back on recreates them with the same passwords.": 70,
  'Recorder Connection Details': 71,
  'Show the addresses, domains, accounts and passwords an external Jibri recorder needs.': 72,
  'Turn on the external recorder in the Recording action first.': 73,
  'Set each value below as the Jibri environment variable of the same name, and have Jibri trust the certificate. Keep both passwords secret: anyone holding the control password administers this Jitsi and can watch and hear every meeting.': 74,
  'Use any one of these that your recorder can reach.': 75,
  'No private address is enabled on the "Recorder XMPP" interface. Enable one, then run this action again.': 76,
  'Where the recorder opens meetings. Use one whose certificate it trusts.': 77,
  "Jibri's control account: a full Jitsi and Prosody administrator with access to every meeting's audio and video. Treat it like a root password.": 78,
  "The account Jibri's browser joins meetings with. Participants do not see it.": 79,
  'Cannot read the Recorder XMPP addresses, so the port may be published beyond your private network. Restart Jitsi Meet.': 80,
  'Waiting for a private address on the "Recorder XMPP" interface.': 81,
  'Rotate Recorder Passwords': 82,
  "Replace both passwords of the external Jibri recorder's accounts with newly generated ones.": 83,
  'The recorder stops connecting until you copy the new passwords from Recorder Connection Details into its .env file and restart it. Saving them restarts Jitsi Meet if it is running, twice while Recording is on, which ends any meeting in progress.': 84,
  'New recorder passwords are set. Run Recorder Connection Details and update the recorder with them.': 85,
  'Jibri trusts any XMPP certificate unless this is false, so anyone between it and this server could capture the control password.': 86,
  'XMPP certificate': 87,
  'Not created yet. Start Jitsi Meet with recording on, then run this action again.': 88,
  'Save as a .crt file and mount it into /usr/local/share/ca-certificates/ in the Jibri container, so Jibri can verify it is talking to this server.': 89,
  'Not readable: the certificate file is not a single PEM certificate. Replace it as the instructions describe, then run this action again.': 90,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
