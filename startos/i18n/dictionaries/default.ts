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
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
