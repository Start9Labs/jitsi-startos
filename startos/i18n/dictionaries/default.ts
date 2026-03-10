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

  // interfaces.ts
  'Web UI': 16,
  'The web interface of Jitsi Meet': 17,
  'Video Bridge Media': 18,
  'WebRTC media transport for video and audio': 19,
  'TURN Relay': 20,
  'TURN relay server for NAT traversal': 21,

  // actions
  'Configure TURN': 22,
  'Enable or disable the TURN relay server for participants behind restrictive NATs or firewalls. Requires a public address configured in StartOS.': 23,
  'Enable TURN': 24,

  // main.ts (TURN)
  'Waiting for a public domain on the TURN interface. Please configure a domain in StartOS.': 25,

  // init
  'Enable a TURN relay server to help participants behind restrictive firewalls or NATs join video calls.': 26,
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
