import { utils } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 8000
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
// Coturn publishes its shared secret at `shared/turn-secret` on its `main`
// volume. We mount only that subpath read-only (a directory bind — dependency
// mounts are always directory mounts), so we never see the rest of Coturn's
// volume (turnserver.conf, the coturn database).
export const coturnMountpoint = '/mnt/coturn'
export const coturnSecretPath = '/mnt/coturn/turn-secret'

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

// Every image reads its seed configuration from /config.
export const configMountpoint = '/config'

// Prosody keeps XMPP accounts under `data_path` (/var/lib/prosody). Upstream
// generates its config under /run and treats /config as a read-only seed, so
// account data must live on its own volume subpath to survive a restart.
export const prosodyStorageMountpoint = '/var/lib/prosody'

// The image runs as `s6` (uid 1000); StartOS mounts volumes root-owned, and
// prosody aborts at startup if this directory is not writable.
export const prosodyUser = 's6'

export const prosodyMounts = sdk.Mounts.of()
  .mountVolume({
    volumeId: 'main',
    subpath: 'prosody',
    mountpoint: configMountpoint,
    readonly: false,
  })
  .mountVolume({
    volumeId: 'main',
    subpath: 'prosody-storage',
    mountpoint: prosodyStorageMountpoint,
    readonly: false,
  })

export const webMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'web',
  mountpoint: configMountpoint,
  readonly: false,
})

export const jicofoMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'jicofo',
  mountpoint: configMountpoint,
  readonly: false,
})

export const jvbMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'jvb',
  mountpoint: configMountpoint,
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
    // STUN reflexive discovery and plain TURN both use the plain UDP/TCP port;
    // the turns: port (5349) is TLS-over-TCP only.
    if (turn.turnPort) {
      env.STUN_HOST = turn.domain
      env.STUN_PORT = String(turn.turnPort)
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
