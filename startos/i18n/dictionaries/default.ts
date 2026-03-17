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
  'TURN Server': 13,
  'The TURN server is ready': 14,
  'The TURN server is not ready': 15,

  'Required to support mobile carriers, hotel WiFi, and UDP-blocking firewalls. To enable, add a public domain to the "TURN Relay" interface.': 37,
  'Required for clearnet. Enable a public IPv4 address in the "Video Bridge Media" interface.': 38,
  'Only needed if using a public domain.': 39,

  // interfaces.ts
  'Web UI': 16,
  'The web interface of Jitsi Meet': 17,
  'Video Bridge Media': 18,
  'WebRTC media transport for video and audio': 19,
  'TURN Relay': 20,
  'TURN relay server for NAT traversal': 21,

  // init
  'Create an admin password so only you can start meetings.': 27,

  // actions (auth)
  'Reset Admin Password': 28,
  'Create Admin Password': 29,
  'Reset the administrator password for creating meetings': 30,
  'Create the administrator password for creating meetings': 31,
  'Success': 32,
  'Your admin password has been set. Use these credentials to create meetings.': 33,
  'Username': 34,
  'Password': 35,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
