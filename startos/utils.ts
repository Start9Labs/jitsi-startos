import { X509Certificate } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import { FileHandle, lstat, open } from 'node:fs/promises'
import { types, utils } from '@start9labs/start-sdk'
import { i18n } from './i18n'
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

// Prosody's client port, bound for Jibri while Recording is on and exported
// as an interface only while recorders on other servers are allowed. Its own
// host, so no domain added to another interface ever reaches it.
export const xmppPort = 5222
export const xmppHostId = 'xmpp-multi'
export const xmppInterfaceId = 'xmpp'

// Every enabled address on a binding that reaches past the private network: a
// public IP or domain, or an address a plugin adds (an onion, say).
export function exposedAddresses(
  addresses: types.DerivedAddressInfo | undefined,
): string[] {
  if (!addresses) return []
  return addresses.available
    .filter(
      (h) =>
        (h.public ||
          h.metadata.kind === 'public-domain' ||
          h.metadata.kind === 'plugin') &&
        utils.isAddressEnabled(addresses, h),
    )
    .map((h) => {
      // Brackets keep an IPv6 address readable before its port.
      const host = h.metadata.kind === 'ipv6' ? `[${h.hostname}]` : h.hostname
      return h.port == null ? host : `${host}:${h.port}`
    })
}

// What the xmpp-exposure check last learned about the Recorder XMPP binding:
// its exposed addresses and how many private ones a recorder could dial, that
// the binding is not there yet, or that the watch on it failed.
export type XmppExposure =
  | { exposed: string[]; reachable: number }
  | 'unbound'
  | 'unreadable'

export function xmppExposure(
  addresses: types.DerivedAddressInfo | undefined,
): XmppExposure {
  if (!addresses) return 'unbound'
  return {
    exposed: exposedAddresses(addresses),
    reachable: recorderXmppServers(addresses).length,
  }
}

// Follows the Recorder XMPP binding for the xmpp-exposure check. The SDK calls
// back once with no value when a watch fails, and then stops watching, so from
// then on the state is 'unreadable' rather than the last answer, which nothing
// would ever update again.
export async function followXmppExposure(watch: {
  once(): Promise<XmppExposure>
  onChange(
    callback: (value: XmppExposure | undefined) => { cancel: boolean },
  ): void
}): Promise<() => XmppExposure> {
  let state = await watch.once()
  watch.onChange((next) => {
    state = next ?? 'unreadable'
    return { cancel: false }
  })
  return () => state
}

// Fails closed: a watch that stopped answering cannot vouch for the port, and
// success is claimed only once a private address is actually published.
export function xmppExposureResult(
  state: XmppExposure,
): types.NamedHealthCheckResultKindInput {
  if (state === 'unreadable')
    return {
      result: 'failure',
      message: i18n(
        'Cannot read the Recorder XMPP addresses, so the port may be published beyond your private network. Restart Jitsi Meet.',
      ),
    }
  if (state !== 'unbound' && state.exposed.length)
    return {
      result: 'failure',
      message: i18n(
        'The recorder XMPP port is published beyond your private network, at ${addresses}. Disable those addresses on the "Recorder XMPP" interface.',
        { addresses: state.exposed.join(', ') },
      ),
    }
  if (state === 'unbound' || !state.reachable)
    return {
      result: 'starting',
      waiting: true,
      message: i18n(
        'Waiting for a private address on the "Recorder XMPP" interface.',
      ),
    }
  return {
    result: 'success',
    message: i18n(
      'The recorder XMPP port is published on private addresses only.',
    ),
  }
}

// The `host:port` pairs a Jibri off the box can dial: enabled, private, and
// neither loopback nor the container bridge. IPv6 is left out because Jibri
// splits XMPP_SERVER at its first colon.
export function recorderXmppServers(
  addresses: types.DerivedAddressInfo | undefined,
): string[] {
  if (!addresses) return []
  return utils
    .filterNonLocal(
      addresses.available.filter((h) => utils.isAddressEnabled(addresses, h)),
    )
    .filter(
      (h) =>
        !h.public &&
        h.port != null &&
        h.metadata.kind !== 'ipv6' &&
        h.metadata.kind !== 'public-domain' &&
        h.metadata.kind !== 'plugin',
    )
    .map((h) => `${h.hostname}:${h.port}`)
}

// What a Jibri needs to record here, as Jitsi publishes it: on the `public`
// volume for a Jibri on this server, and encoded into one string for a Jibri
// on another. The Jibri package imports these.
export const recorderPublicSubpath = 'recorder'
export const recorderCredentialsFile = 'credentials.json'
export type RecorderCredentials = {
  xmppPassword: string
  recorderPassword: string
  certSha256: string
}
export type RecorderConnection = RecorderCredentials & {
  v: 1
  xmppServers: string[]
  publicUrls: string[]
  // base64 SHA-256 of this server's root CA public key, which signs the Web
  // UI's certificate on every address that is not a public domain.
  webCaSpki?: string
}
const connectionPrefix = 'jitsi-recorder:'

export function encodeRecorderConnection(c: RecorderConnection): string {
  return connectionPrefix + Buffer.from(JSON.stringify(c)).toString('base64url')
}

export function decodeRecorderConnection(text: string): RecorderConnection {
  const t = text.trim()
  if (!t.startsWith(connectionPrefix))
    throw new Error('not a connection string')
  const c = JSON.parse(
    Buffer.from(t.slice(connectionPrefix.length), 'base64url').toString(),
  )
  if (
    c?.v !== 1 ||
    !Array.isArray(c.xmppServers) ||
    !c.xmppServers.length ||
    !Array.isArray(c.publicUrls) ||
    ![c.xmppPassword, c.recorderPassword, c.certSha256].every(
      (x) => typeof x === 'string' && x,
    )
  )
    throw new Error('incomplete connection string')
  return c
}

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

// The images' defaults, named here so the env and the Recorder Connection
// Details action cannot disagree. XMPP_HIDDEN_DOMAIN is never passed: every
// template defaults it to this, and Jibri's recorder account lives there.
export const xmppHiddenDomain = 'hidden.meet.jitsi'
export const jibriXmppUser = 'jibri'
export const jibriRecorderUser = 'recorder'
export const jibriBreweryMuc = 'jibribrewery'

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

// First in the image's `plugin_paths`; the image declares it as an empty volume.
export const prosodyPluginsMountpoint = '/prosody-plugins-custom'

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
  .mountVolume({
    volumeId: 'main',
    subpath: 'prosody-plugins-custom',
    mountpoint: prosodyPluginsMountpoint,
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

// prosodyctl needs a rendered config, and the running container keeps its own
// under /run, so actions render a throwaway copy from the same templates.
// With the env below it points at the same accounts on the storage volume.
const prosodyctlDir = '/tmp/prosody-config'
export const prosodyctlCfg = `${prosodyctlDir}/prosody.cfg.lua`
export const renderProsodyctlCfg =
  `mkdir -p ${prosodyctlDir}/conf.d ${prosodyctlDir}/certs && ` +
  `tpl /defaults/prosody.cfg.lua > ${prosodyctlCfg} && ` +
  `tpl /defaults/conf.d/jitsi-meet.cfg.lua > ${prosodyctlDir}/conf.d/jitsi-meet.cfg.lua`
export const prosodyctlEnv = {
  ...xmppConfig,
  ENABLE_AUTH: '1',
  ENABLE_GUESTS: '1',
  AUTH_TYPE: 'internal',
}

// Prosody's internal storage keeps each host's accounts in a folder named
// after the host with every character but a letter or digit written as %xx.
export function prosodyHostDir(host: string): string {
  const escaped = host.replace(
    /[^A-Za-z0-9]/g,
    (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`,
  )
  return `${prosodyStorageMountpoint}/data/${escaped}`
}

// The auth domain's certificate, which a recorder can pin. The image generates
// a certificate it finds missing under /run at every start, so one kept only
// there changes on each restart; it copies /config over /run first, so one
// kept here, on the volume, is used every time instead.
export const recorderCertDir = `${configMountpoint}/certs`
const recorderCertName = xmppConfig.XMPP_AUTH_DOMAIN
// The same folder, as a path under the main volume (prosodyMounts puts its
// `prosody` subpath at /config), and the certificate's name in it.
export const recorderCertVolumeDir = 'prosody/certs'
export const recorderCertFile = `${recorderCertName}.crt`

// Runs before prosody on every start. On: keeps the pinnable certificate,
// creating one (ten years, CA:FALSE) when none is there or the one there could
// sign others, as an older image's could. Off: deletes Jibri's two accounts, so a
// password left over from an earlier time on cannot sign in. Off works on the
// files because prosodyctl in this image deletes users only through a running
// prosody, and the recorder's host is not configured while recording is off;
// register-setup recreates both accounts from store.json when recording comes
// back on.
export function recorderSetupExec(on: boolean): {
  command: [string, ...string[]]
  user?: string
} {
  if (on) {
    const crt = `${recorderCertDir}/${recorderCertName}.crt`
    const key = `${recorderCertDir}/${recorderCertName}.key`
    const owner = `${prosodyUser}:${prosodyUser}`
    // Runs as prosody's user, who owns the folder and so can plant links in
    // it; anything those reach is already writable by that user.
    const asProsody = [
      'set -eu',
      `if [ ! -s '${crt}' ] || [ ! -s '${key}' ] || ! openssl x509 -in '${crt}' -noout -ext basicConstraints 2>/dev/null | grep -q 'CA:FALSE'; then`,
      `  rm -f '${key}.new' '${crt}.new'`,
      `  openssl req -quiet -x509 -newkey rsa:2048 -nodes -sha256 -days 3650 -subj '/CN=${recorderCertName}' -addext 'subjectAltName=DNS:${recorderCertName}' -addext 'basicConstraints=critical,CA:FALSE' -addext 'keyUsage=critical,digitalSignature,keyEncipherment' -addext 'extendedKeyUsage=serverAuth' -keyout '${key}.new' -out '${crt}.new'`,
      `  mv -f '${key}.new' '${key}'`,
      `  mv -f '${crt}.new' '${crt}'`,
      'fi',
      `chmod 600 '${key}'`,
    ].join('\n')
    return {
      command: [
        'sh',
        '-c',
        [
          'set -eu',
          // /config is made root's first, so prosody's user cannot swap the
          // folder for a link once the check below has passed. An install
          // that came through the 2.0.11146:2 migration has /config owned by
          // that user (`chown -R`); the image only reads it, so 755 keeps it
          // readable. Root follows no link: `chown -h` changes a link itself,
          // and it touches only the folder and the two files, which an older
          // image may have left owned by another user.
          `chown -h 0:0 '${configMountpoint}'`,
          `chmod 755 '${configMountpoint}'`,
          `if [ -L '${recorderCertDir}' ]; then echo '${recorderCertDir} is a symbolic link' >&2; exit 1; fi`,
          `mkdir -p '${recorderCertDir}'`,
          `chown -h ${owner} '${recorderCertDir}'`,
          `for f in '${crt}' '${key}'; do if [ -e "$f" ] || [ -L "$f" ]; then chown -h ${owner} "$f"; fi; done`,
          `exec /command/s6-setuidgid ${prosodyUser} sh -c "$1"`,
        ].join('\n'),
        'recorder-setup',
        asProsody,
      ],
      user: 'root',
    }
  }
  const purge = (host: string, user: string) =>
    `purge '${prosodyHostDir(host)}' '${user}'`
  return {
    command: [
      'sh',
      '-c',
      [
        'set -eu',
        // Every file prosody keeps for the user: <host>/<store>/<user>.dat,
        // .list, or .lidx (a list's index). A file prosody removes while find
        // walks the folder is not an error, which would stop Jitsi starting.
        'purge() { [ -d "$1" ] || return 0; find "$1" -ignore_readdir_race -mindepth 2 -maxdepth 2 -type f \\( -name "$2.dat" -o -name "$2.list" -o -name "$2.lidx" \\) -print -delete; }',
        purge(xmppConfig.XMPP_AUTH_DOMAIN, jibriXmppUser),
        purge(xmppHiddenDomain, jibriRecorderUser),
      ].join('\n'),
    ],
  }
}

export type Turn = {
  domain: string
  turnPort: number | null
  turnsPort: number | null
  secret: string
}

// Passwords for Jibri's two accounts, or null while the Recording action is
// off.
export type Recording = {
  JIBRI_XMPP_PASSWORD: string
  JIBRI_RECORDER_PASSWORD: string
} | null

// The Rotate Recorder Passwords action, without its effects. Prosody keeps
// the password an account was created with, so the new ones are registered
// before store.json holds them.
//
// Stored passwords remain authoritative after a failed rotation.
// A rejected write may already have replaced store.json.
//
// Recording off: neither account should exist. Their files are purged first,
// in case Recording was switched off while Jitsi Meet was stopped, then both
// passwords are saved; register-setup creates the accounts from them when
// Recording is back on. If Recording was turned on while this ran, its start
// may already have created them with the old passwords, so they are
// registered after all and Jitsi Meet restarts.
export async function rotateRecorderAccounts(io: {
  recording: boolean
  recordingNow: () => Promise<boolean>
  current: () => Promise<NonNullable<Recording>>
  newPassword: () => string
  register: (user: string, host: string, password: string) => Promise<void>
  purge: () => Promise<void>
  save: (passwords: NonNullable<Recording>) => Promise<void>
  restart: () => Promise<void>
}): Promise<void> {
  const next = {
    JIBRI_XMPP_PASSWORD: io.newPassword(),
    JIBRI_RECORDER_PASSWORD: io.newPassword(),
  }
  const accounts = [
    [jibriXmppUser, xmppConfig.XMPP_AUTH_DOMAIN, 'JIBRI_XMPP_PASSWORD'],
    [jibriRecorderUser, xmppHiddenDomain, 'JIBRI_RECORDER_PASSWORD'],
  ] as const
  const registerAll = async (passwords: NonNullable<Recording>) => {
    for (const [user, host, field] of accounts)
      await io.register(user, host, passwords[field])
  }
  const recover = async () => {
    try {
      const stored = await io.current()
      for (const [user, host, field] of accounts) {
        try {
          await io.register(user, host, stored[field])
        } catch (e) {
          console.error(`Could not reconcile recorder account ${user}`, e)
        }
      }
    } catch (e) {
      console.error('Could not read stored recorder passwords for recovery', e)
    }
    await io.restart().catch((e) => {
      console.error(
        'Could not restart Jitsi Meet after recorder rotation failed',
        e,
      )
    })
  }
  if (io.recording) {
    try {
      await registerAll(next)
      await io.save(next)
    } catch (e) {
      await recover()
      throw e
    }
    return
  }
  await io.purge()
  await io.save(next)
  if (!(await io.recordingNow())) return
  try {
    await registerAll(next)
  } catch (e) {
    await recover()
    throw e
  }
  await io.restart()
}

// Whether StartOS means the service to be running: sdk.restart on a stopped
// service would start it, which an action's cleanup must not do.
export function isRunning(
  status: { desired: { main: string } } | null,
): boolean {
  return (
    status?.desired.main === 'running' || status?.desired.main === 'restarting'
  )
}

// The recorder's certificate as Recorder Connection Details shows it. The
// folder belongs to prosody's user, who could plant a link or a fifo there,
// so a link (the folder or the file) or anything but a small regular file is
// refused, and the text is shown only if it is exactly one PEM certificate
// that parses. On Linux, where the action runs, the folder is opened first
// (refused if it is a link) and the file is opened inside that open folder
// through /proc/self/fd, so the folder cannot be swapped for a link between
// the check and the read. Elsewhere (the unit tests on a Mac) the folder is
// checked with lstat and then opened by path, which leaves that window open.
export const recorderCertMaxBytes = 64 * 1024

export function singleCertificatePem(text: string): string | null {
  const m =
    /^\s*(-----BEGIN CERTIFICATE-----\r?\n(?:[A-Za-z0-9+/=]{1,76}\r?\n)+-----END CERTIFICATE-----)\s*$/.exec(
      text,
    )
  if (!m) return null
  const pem = m[1].replace(/\r\n/g, '\n')
  try {
    new X509Certificate(pem)
  } catch {
    return null
  }
  return pem
}

export async function readRecorderCert(
  dir: string,
  file: string,
): Promise<{ pem: string } | 'missing' | 'unreadable'> {
  let folder: FileHandle | undefined
  let handle: FileHandle | undefined
  try {
    let path = `${dir}/${file}`
    if (process.platform === 'linux') {
      folder = await open(
        dir,
        fsConstants.O_RDONLY |
          fsConstants.O_DIRECTORY |
          fsConstants.O_NOFOLLOW |
          fsConstants.O_NONBLOCK,
      )
      path = `/proc/self/fd/${folder.fd}/${file}`
    } else if (!(await lstat(dir)).isDirectory()) return 'unreadable'
    // O_NONBLOCK so a fifo cannot hold the action open.
    handle = await open(
      path,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK,
    )
    const st = await handle.stat()
    if (!st.isFile() || st.size > recorderCertMaxBytes) return 'unreadable'
    const buf = Buffer.alloc(recorderCertMaxBytes + 1)
    const { bytesRead } = await handle.read(buf, 0, buf.length, 0)
    if (bytesRead > recorderCertMaxBytes) return 'unreadable'
    const pem = singleCertificatePem(buf.toString('utf8', 0, bytesRead))
    return pem ? { pem } : 'unreadable'
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'ENOENT'
      ? 'missing'
      : 'unreadable'
  } finally {
    await handle?.close().catch(() => {})
    await folder?.close().catch(() => {})
  }
}

const commonEnv = {
  TZ: 'UTC',
  ...xmppConfig,
}

// Mitigates CVE-2026-114938 (Java4Shell). The images' run scripts overwrite JAVA_SYS_PROPS.
export const javaEnv = {
  ...commonEnv,
  JAVA_TOOL_OPTIONS: '-XX:-UseBASE64Intrinsics',
}

// The client's live-streaming dialog validates what a moderator types against
// this; Jibri takes either a YouTube stream key or a full RTMP(S) URL.
const liveStreamingInput =
  '^(?:rtmps?://[^ ]+|(?:[a-zA-Z0-9]{4}(?:-(?!$)|$)){4})$'

export function webEnv(opts: { recording: boolean; liveStreaming: boolean }) {
  const env: Record<string, string> = {
    ...commonEnv,
    ENABLE_AUTH: '1',
    ENABLE_GUESTS: '1',
    // StartOS handles TLS; the web container serves plain HTTP
    DISABLE_HTTPS: '1',
    // Generate a relative BOSH URL (/http-bind) so it works from any
    // origin (.local, clearnet, Tor) without knowing the public hostname
    BOSH_RELATIVE: '1',
    // No relative option exists for websocket — it always generates an
    // absolute wss://localhost:8443 URL. Disable it so the client uses BOSH.
    ENABLE_XMPP_WEBSOCKET: '0',
    // Internal nginx proxy target for BOSH requests → prosody
    XMPP_BOSH_URL_BASE: 'http://localhost:5280',
  }

  // Turns on the client's recording service and names the hidden domain, so
  // the recorder is left out of the participant list. The template reads no
  // brewery name.
  if (opts.recording) {
    env.ENABLE_RECORDING = '1'
    if (opts.liveStreaming) {
      env.ENABLE_LIVESTREAMING = '1'
      env.ENABLE_LIVESTREAMING_VALIDATOR_REGEXP_STRING = liveStreamingInput
    }
  }

  return env
}

export function jicofoEnv(opts: {
  JICOFO_AUTH_PASSWORD: string
  recording: boolean
}) {
  const env: Record<string, string> = {
    ...javaEnv,
    ENABLE_AUTH: '1',
    ENABLE_GUESTS: '1',
    JICOFO_AUTH_USER: 'focus',
    JICOFO_AUTH_PASSWORD: opts.JICOFO_AUTH_PASSWORD,
  }

  // Jicofo looks for Jibri in this room of the internal MUC, and trusts the
  // hidden domain once recording is on.
  if (opts.recording) {
    env.ENABLE_RECORDING = '1'
    env.JIBRI_BREWERY_MUC = jibriBreweryMuc
  }

  return env
}

export function prosodyEnv(opts: {
  JICOFO_AUTH_PASSWORD: string
  JVB_AUTH_PASSWORD: string
  turn: Turn | null
  modules: Record<
    'XMPP_MODULES' | 'XMPP_MUC_MODULES' | 'XMPP_SPEAKERSTATS_MODULES',
    string[]
  >
  recording: Recording
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

  // The image's templates split each list on commas; an unset variable adds
  // nothing.
  for (const [name, modules] of Object.entries(opts.modules)) {
    if (modules.length) env[name] = modules.join(',')
  }

  // The image registers both accounts at startup and lists the control
  // account among prosody's admins. It creates an account only if it is
  // missing, so a changed password would never reach an existing one (the
  // Rotate Recorder Passwords action re-registers them itself). The
  // brewery is a room on the internal MUC that Jicofo and Jibri both join;
  // prosody reads no name for it.
  const recording = opts.recording
  if (recording) {
    env.ENABLE_RECORDING = '1'
    env.JIBRI_XMPP_USER = jibriXmppUser
    env.JIBRI_XMPP_PASSWORD = recording.JIBRI_XMPP_PASSWORD
    env.JIBRI_RECORDER_USER = jibriRecorderUser
    env.JIBRI_RECORDER_PASSWORD = recording.JIBRI_RECORDER_PASSWORD
  }

  return env
}
