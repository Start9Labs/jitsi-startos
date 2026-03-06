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
  'Set Primary URL': 22,
  'Choose which URL to use as the primary address for Jitsi Meet. This determines the hostname advertised for video and TURN connections.': 23,
  'URL': 24,

  // init tasks
  'Jitsi requires a primary URL for video conferencing to work. Select the address participants will use to connect.': 25,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
