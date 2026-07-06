import { utils } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 80
export const jvbMediaPort = 10000
export const jvbHttpPort = 8080
export const jicofoHealthPort = 8888

// Host ids (the sdk.MultiHost.of groups) — distinct from the interface ids exported on them.
export const uiHostId = 'ui-multi'
export const jvbMediaHostId = 'jvb-media-multi'

export const uiInterfaceId = 'ui'
export const jvbMediaInterfaceId = 'jvb-media'

// The external Coturn package Jitsi depends on for TURN/STUN relay.
export const coturnId = 'coturn'
export const coturnVersionRange = '>=4.14.0:0'
export const coturnHostId = 'turn'
export const coturnTurnInterfaceId = 'turn'
export const coturnTurnsInterfaceId = 'turns'
// Coturn's whole `main` volume is mounted read-only as a directory (a
// single-file bind mount needs the target file to pre-exist in the container);
// the shared secret lives in store.json at the volume root.
export const coturnMountpoint = '/mnt/coturn'
export const coturnSecretPath = '/mnt/coturn/store.json'

export function getPassword() {
  return utils.getDefaultString({
    charset: 'a-z,A-Z,0-9',
    len: 32,
  })
}

export const xmppConfig = {
  XMPP_DOMAIN: 'meet.jitsi',
  XMPP_AUTH_DOMAIN: 'auth.meet.jitsi',
  XMPP_MUC_DOMAIN: 'muc.meet.jitsi',
  XMPP_INTERNAL_MUC_DOMAIN: 'internal-muc.meet.jitsi',
  XMPP_GUEST_DOMAIN: 'guest.meet.jitsi',
  XMPP_SERVER: 'localhost',
}

export const prosodyMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'prosody',
  mountpoint: '/config',
  readonly: false,
})

export const webMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'web',
  mountpoint: '/config',
  readonly: false,
})

export const jicofoMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'jicofo',
  mountpoint: '/config',
  readonly: false,
})

export const jvbMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'jvb',
  mountpoint: '/config',
  readonly: false,
})

export const prosodyPort = 5280

// The external Coturn endpoint, resolved from the Coturn package's interfaces
// plus its shared secret (read from Coturn's volume). `null` when Coturn isn't
// installed/running or has no public domain yet — Jitsi then runs without TURN.
export type CoturnTurn = {
  domain: string
  turnPort: number | null
  turnsPort: number | null
  secret: string
}

export function prosodyEnv(opts: {
  JICOFO_AUTH_PASSWORD: string
  JVB_AUTH_PASSWORD: string
  turn?: CoturnTurn | null
}) {
  const env: Record<string, string> = {
    TZ: 'UTC',
    ...xmppConfig,
    ENABLE_AUTH: '1',
    ENABLE_GUESTS: '1',
    AUTH_TYPE: 'internal',
    JICOFO_AUTH_USER: 'focus',
    JICOFO_AUTH_PASSWORD: opts.JICOFO_AUTH_PASSWORD,
    JVB_AUTH_USER: 'jvb',
    JVB_AUTH_PASSWORD: opts.JVB_AUTH_PASSWORD,
  }

  // Prosody's mod_external_services advertises STUN/TURN to clients and mints
  // time-limited REST-API credentials from TURN_CREDENTIALS (the Coturn secret).
  const turn = opts.turn
  if (turn) {
    env.TURN_CREDENTIALS = turn.secret
    // Coturn serves plain TURN on 3478 over both UDP and TCP; advertise both so
    // clients prefer lower-latency UDP and fall back to TCP.
    env.TURN_TRANSPORT = 'udp,tcp'
    const stunPort = turn.turnPort ?? turn.turnsPort
    if (stunPort) {
      env.STUN_HOST = turn.domain
      env.STUN_PORT = String(stunPort)
    }
    if (turn.turnPort) {
      env.TURN_HOST = turn.domain
      env.TURN_PORT = String(turn.turnPort)
    }
    if (turn.turnsPort) {
      env.TURNS_HOST = turn.domain
      env.TURNS_PORT = String(turn.turnsPort)
    }
  }

  return env
}
