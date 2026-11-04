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

// Clear of standalone Coturn's 3478, so both packages can be installed.
export const turnPort = 3479
export const turnsPort = 443
export const turnHostId = 'turn-multi'
export const turnInterfaceId = 'turn'

export const coturnDataDir = '/var/lib/coturn'
export const coturnConfPath = `${coturnDataDir}/turnserver.conf`

export const coturnMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'coturn',
  mountpoint: coturnDataDir,
  readonly: false,
})

// Coturn rewrites a peer equal to its external-ip to its relay-ip, so relaying
// to the bridge's public address lands on the bridge in this container. Every
// other peer is denied.
export function renderTurnserverConf(cfg: {
  realm: string
  externalIps: string[]
  containerIp: string
  secret: string
}): string {
  return (
    [
      `listening-port=${turnPort}`,
      'no-tls',
      'no-tcp-relay',
      `relay-ip=${cfg.containerIp}`,
      `realm=${cfg.realm}`,
      `server-name=${cfg.realm}`,
      'fingerprint',
      'use-auth-secret',
      `static-auth-secret=${cfg.secret}`,
      'no-multicast-peers',
      `allowed-peer-ip=${cfg.containerIp}`,
      'denied-peer-ip=0.0.0.0-255.255.255.255',
      'denied-peer-ip=::-ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      `pidfile=${coturnDataDir}/turnserver.pid`,
      'log-file=stdout',
      ...cfg.externalIps.map((ip) => `external-ip=${ip}/${cfg.containerIp}`),
    ].join('\n') + '\n'
  )
}

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

// Prosody keeps XMPP accounts under `data_path`, which is a `data/`
// subdirectory of this mountpoint as of stable-11146-2. Upstream generates its
// config under /run and treats /config as a read-only seed, so account data
// must live on its own volume subpath to survive a restart.
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

export type Turn = {
  domain: string
  turnPort: number | null
  turnsPort: number | null
  secret: string
}

export function prosodyEnv(opts: {
  JICOFO_AUTH_PASSWORD: string
  JVB_AUTH_PASSWORD: string
  turn: Turn | null
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
  // time-limited REST-API credentials from TURN_CREDENTIALS.
  const turn = opts.turn
  if (turn) {
    env.TURN_CREDENTIALS = turn.secret
    env.TURN_TRANSPORT = 'udp,tcp'
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
