// Run with `npm test`. The bundler resolves the package's extensionless
// imports, which Node alone cannot.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { types, utils } from '@start9labs/start-sdk'
import {
  exposedAddresses,
  followXmppExposure,
  isRunning,
  jicofoEnv,
  prosodyEnv,
  prosodyHostDir,
  readRecorderCert,
  recorderCertMaxBytes,
  recorderSetupExec,
  recorderXmppServers,
  rotateRecorderAccounts,
  singleCertificatePem,
  Turn,
  webEnv,
  XmppExposure,
  xmppExposure,
  xmppExposureResult,
} from './utils'

const JICOFO_AUTH_PASSWORD = 'jicofo-secret'
const JVB_AUTH_PASSWORD = 'jvb-secret'
const recording = {
  JIBRI_XMPP_PASSWORD: 'jibri-secret',
  JIBRI_RECORDER_PASSWORD: 'recorder-secret',
}
// The Prosody Modules action's lists, empty as on a fresh install.
const noModules = {
  XMPP_MODULES: [],
  XMPP_MUC_MODULES: [],
  XMPP_SPEAKERSTATS_MODULES: [],
}
const turn: Turn = {
  domain: 'turn.example.com',
  turnPort: 3479,
  turnsPort: 443,
  secret: 'turn-secret',
}

// Each container's environment before the Recording action existed, written
// out from 963bc49 rather than built from the code under test.
const xmpp = {
  TZ: 'UTC',
  XMPP_DOMAIN: 'meet.jitsi',
  XMPP_AUTH_DOMAIN: 'auth.meet.jitsi',
  XMPP_MUC_DOMAIN: 'muc.meet.jitsi',
  XMPP_INTERNAL_MUC_DOMAIN: 'internal-muc.meet.jitsi',
  XMPP_GUEST_DOMAIN: 'guest.meet.jitsi',
  XMPP_SERVER: 'localhost',
}
const before = {
  web: {
    ...xmpp,
    ENABLE_AUTH: '1',
    ENABLE_GUESTS: '1',
    DISABLE_HTTPS: '1',
    BOSH_RELATIVE: '1',
    ENABLE_XMPP_WEBSOCKET: '0',
    XMPP_BOSH_URL_BASE: 'http://localhost:5280',
  },
  jicofo: {
    ...xmpp,
    JAVA_TOOL_OPTIONS: '-XX:-UseBASE64Intrinsics',
    ENABLE_AUTH: '1',
    ENABLE_GUESTS: '1',
    JICOFO_AUTH_USER: 'focus',
    JICOFO_AUTH_PASSWORD,
  },
  prosody: {
    ...xmpp,
    ENABLE_AUTH: '1',
    ENABLE_GUESTS: '1',
    AUTH_TYPE: 'internal',
    JICOFO_AUTH_USER: 'focus',
    JICOFO_AUTH_PASSWORD,
    JVB_AUTH_USER: 'jvb',
    JVB_AUTH_PASSWORD,
  },
  prosodyTurn: {
    TURN_CREDENTIALS: 'turn-secret',
    TURN_TRANSPORT: 'udp,tcp',
    STUN_HOST: 'turn.example.com',
    STUN_PORT: '3479',
    TURN_HOST: 'turn.example.com',
    TURN_PORT: '3479',
    TURNS_HOST: 'turn.example.com',
    TURNS_PORT: '443',
  },
}

// What switching on adds: every variable before stays as it was.
function added(off: Record<string, string>, on: Record<string, string>) {
  for (const [k, v] of Object.entries(off)) assert.equal(on[k], v, k)
  return Object.fromEntries(Object.entries(on).filter(([k]) => !(k in off)))
}

test('off: web, jicofo and prosody get the environment they had before', () => {
  assert.deepStrictEqual(webEnv({ recording: false }), before.web)
  assert.deepStrictEqual(
    jicofoEnv({ JICOFO_AUTH_PASSWORD, recording: false }),
    before.jicofo,
  )
  assert.deepStrictEqual(
    prosodyEnv({
      JICOFO_AUTH_PASSWORD,
      JVB_AUTH_PASSWORD,
      turn: null,
      modules: noModules,
      recording: null,
    }),
    before.prosody,
  )
  assert.deepStrictEqual(
    prosodyEnv({
      JICOFO_AUTH_PASSWORD,
      JVB_AUTH_PASSWORD,
      turn,
      modules: noModules,
      recording: null,
    }),
    { ...before.prosody, ...before.prosodyTurn },
  )
})

test('on: each container gets exactly the recording variables', () => {
  assert.deepStrictEqual(added(before.web, webEnv({ recording: true })), {
    ENABLE_RECORDING: '1',
  })
  assert.deepStrictEqual(
    added(before.jicofo, jicofoEnv({ JICOFO_AUTH_PASSWORD, recording: true })),
    { ENABLE_RECORDING: '1', JIBRI_BREWERY_MUC: 'jibribrewery' },
  )
  const prosodyOn = {
    ENABLE_RECORDING: '1',
    JIBRI_XMPP_USER: 'jibri',
    JIBRI_XMPP_PASSWORD: 'jibri-secret',
    JIBRI_RECORDER_USER: 'recorder',
    JIBRI_RECORDER_PASSWORD: 'recorder-secret',
  }
  assert.deepStrictEqual(
    added(
      before.prosody,
      prosodyEnv({
        JICOFO_AUTH_PASSWORD,
        JVB_AUTH_PASSWORD,
        turn: null,
        modules: noModules,
        recording,
      }),
    ),
    prosodyOn,
  )
  assert.deepStrictEqual(
    added(
      { ...before.prosody, ...before.prosodyTurn },
      prosodyEnv({
        JICOFO_AUTH_PASSWORD,
        JVB_AUTH_PASSWORD,
        turn,
        modules: noModules,
        recording,
      }),
    ),
    prosodyOn,
  )
})

test('on: module lists and recording variables both reach prosody', () => {
  const env = prosodyEnv({
    JICOFO_AUTH_PASSWORD,
    JVB_AUTH_PASSWORD,
    turn: null,
    modules: {
      XMPP_MODULES: ['speaker_log'],
      XMPP_MUC_MODULES: ['muc_a', 'muc_b'],
      XMPP_SPEAKERSTATS_MODULES: [],
    },
    recording,
  })
  assert.deepStrictEqual(added(before.prosody, env), {
    XMPP_MODULES: 'speaker_log',
    XMPP_MUC_MODULES: 'muc_a,muc_b',
    ENABLE_RECORDING: '1',
    JIBRI_XMPP_USER: 'jibri',
    JIBRI_XMPP_PASSWORD: 'jibri-secret',
    JIBRI_RECORDER_USER: 'recorder',
    JIBRI_RECORDER_PASSWORD: 'recorder-secret',
  })
})

test('on: the passwords reach prosody only', () => {
  const secrets = Object.values(recording)
  const prosody = Object.values(
    prosodyEnv({
      JICOFO_AUTH_PASSWORD,
      JVB_AUTH_PASSWORD,
      turn: null,
      modules: noModules,
      recording,
    }),
  )
  for (const v of secrets) assert.ok(prosody.includes(v))
  for (const env of [
    webEnv({ recording: true }),
    jicofoEnv({ JICOFO_AUTH_PASSWORD, recording: true }),
  ]) {
    assert.equal(env.ENABLE_RECORDING, '1')
    for (const v of secrets) assert.ok(!Object.values(env).includes(v))
  }
})

// StartOS assigns the external port; 61234 stands in for one that is not 5222.
const port = 61234
const at = (
  hostname: string,
  metadata: types.HostnameInfo['metadata'],
  isPublic = false,
): types.HostnameInfo => ({
  ssl: false,
  public: isPublic,
  hostname,
  port,
  metadata,
})
const lan = at('192.168.1.10', { kind: 'ipv4', gateway: 'eth0' })
const wireguard = at('10.59.0.2', { kind: 'ipv4', gateway: 'wg0' })
const mdns = at('server.local', { kind: 'mdns', gateways: ['eth0'] })
const ula = at('fd00::10', { kind: 'ipv6', gateway: 'eth0', scopeId: 2 })
const bridge = at('10.0.3.1', { kind: 'ipv4', gateway: 'lxcbr0' })
const wan = at('203.0.113.5', { kind: 'ipv4', gateway: 'eth0' }, true)
const domain = at(
  'xmpp.example.com',
  { kind: 'public-domain', gateway: 'eth0' },
  true,
)
const onion = at('abc.onion', {
  kind: 'plugin',
  packageId: 'tor',
  removeAction: null,
  overflowActions: [],
  info: null,
})

const binding = (
  available: types.HostnameInfo[],
  overrides: Partial<types.DerivedAddressInfo> = {},
): types.DerivedAddressInfo => ({
  enabled: [],
  disabled: [],
  guaWan: [],
  lanEnabled: [],
  available,
  ...overrides,
})

test('a fresh binding has no exposed address, and lists its private ones at the assigned port', () => {
  const addresses = binding([lan, wireguard, mdns, ula, bridge, wan])
  assert.deepStrictEqual(exposedAddresses(addresses), [])
  assert.deepStrictEqual(recorderXmppServers(addresses), [
    `192.168.1.10:${port}`,
    `10.59.0.2:${port}`,
    `server.local:${port}`,
  ])
  assert.deepStrictEqual(exposedAddresses(undefined), [])
  assert.deepStrictEqual(recorderXmppServers(undefined), [])
})

test('an enabled public IP, a public domain or an onion counts as exposed', () => {
  assert.deepStrictEqual(
    exposedAddresses(binding([lan, wan], { enabled: [`203.0.113.5:${port}`] })),
    [`203.0.113.5:${port}`],
  )
  assert.deepStrictEqual(exposedAddresses(binding([lan, domain])), [
    `xmpp.example.com:${port}`,
  ])
  assert.deepStrictEqual(exposedAddresses(binding([lan, onion])), [
    `abc.onion:${port}`,
  ])
  // None of them is offered to the recorder.
  assert.deepStrictEqual(
    recorderXmppServers(
      binding([lan, wan, domain, onion], {
        enabled: [`203.0.113.5:${port}`],
      }),
    ),
    [`192.168.1.10:${port}`],
  )
})

test('an address the user disabled is neither exposed nor offered', () => {
  const addresses = binding([lan, wireguard, domain], {
    disabled: [
      ['xmpp.example.com', port],
      ['192.168.1.10', port],
    ],
  })
  assert.deepStrictEqual(exposedAddresses(addresses), [])
  assert.deepStrictEqual(recorderXmppServers(addresses), [`10.59.0.2:${port}`])
})

test('an enabled public IPv6 address is named in brackets', () => {
  const v6 = at(
    '2001:db8::5',
    { kind: 'ipv6', gateway: 'eth0', scopeId: 2 },
    true,
  )
  assert.deepStrictEqual(
    exposedAddresses(
      binding([lan, v6], { enabled: [`[2001:db8::5]:${port}`] }),
    ),
    [`[2001:db8::5]:${port}`],
  )
})

test('xmpp-exposure: success only once a private address is published and none is public', () => {
  const result = (s: XmppExposure) => xmppExposureResult(s).result
  assert.equal(result(xmppExposure(binding([lan, wan]))), 'success')
  assert.equal(
    result(xmppExposure(binding([lan, domain]))),
    'failure',
    'a public domain on the binding',
  )
  // Nothing bound yet, or bound with every address off: waiting, never success.
  assert.equal(result(xmppExposure(undefined)), 'starting')
  assert.equal(
    result(
      xmppExposure(binding([lan], { disabled: [['192.168.1.10', port]] })),
    ),
    'starting',
  )
  assert.equal(result('unreadable'), 'failure')
})

// A watch over a real SDK Watchable: `values` are what the host info yields in
// turn, and `fail` makes the stream throw after the last one.
function watchOf(values: XmppExposure[], fail: boolean) {
  const effects = {
    isInContext: true,
    onLeaveContext: () => {},
  } as unknown as types.Effects
  return utils.Watchable.from(effects, {
    once: async () => values[0],
    watch: async function* () {
      for (const v of values) yield v
      if (fail) throw new Error('host info watch failed')
      await new Promise(() => {})
    },
  })
}
const settle = () => new Promise((r) => setTimeout(r, 20))

test('xmpp-exposure follows a public address enabled after start', async () => {
  const clean = xmppExposure(binding([lan]))
  const exposed = xmppExposure(binding([lan, domain]))
  const state = await followXmppExposure(watchOf([clean, exposed], false))
  await settle()
  assert.equal(xmppExposureResult(state()).result, 'failure')
})

test('xmpp-exposure fails closed once the watch errors', async () => {
  const clean = xmppExposure(binding([lan]))
  const state = await followXmppExposure(watchOf([clean], true))
  await settle()
  assert.equal(state(), 'unreadable')
  assert.equal(xmppExposureResult(state()).result, 'failure')
})

test("prosody's account folder for a host, as the image writes it", () => {
  assert.equal(
    prosodyHostDir('auth.meet.jitsi'),
    '/var/lib/prosody/data/auth%2emeet%2ejitsi',
  )
})

test('recorder-setup off: deletes exactly the two Jibri accounts, as the image user', () => {
  const exec = recorderSetupExec(false)
  assert.ok(!('user' in exec), 'runs as the image user, not root')
  const script = exec.command[2]
  const purges = [...script.matchAll(/^purge '([^']*)' '([^']*)'$/gm)].map(
    (m) => [m[1], m[2]],
  )
  assert.deepEqual(purges, [
    [prosodyHostDir('auth.meet.jitsi'), 'jibri'],
    [prosodyHostDir('hidden.meet.jitsi'), 'recorder'],
  ])
  assert.doesNotMatch(script, /openssl|\/config/)
})

test("recorder-setup off: the purge deletes the user's .dat, .list and .lidx files and nothing else, with find told a file vanishing mid-walk is no error", async (t) => {
  const script = recorderSetupExec(false).command[2]
  const fn = script.split('\n').find((l) => l.startsWith('purge() {'))
  assert.ok(fn)
  // GNU find otherwise exits 1 when a file it listed is gone by the time it
  // looks at it, and set -e would then stop Jitsi Meet from starting.
  assert.match(fn, /^purge\(\) \{ [^;]*; find "\$1" -ignore_readdir_race /)
  const root = await mkdtemp(join(tmpdir(), 'recorder-purge-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const host = join(root, 'auth%2emeet%2ejitsi')
  const doomed = [
    'accounts/jibri.dat',
    'roster/jibri.dat',
    'offline/jibri.list',
    'offline/jibri.lidx',
  ]
  const kept = [
    'accounts/focus.dat',
    'accounts/jibri.dat.bak',
    'accounts/xjibri.dat',
    'offline/jibri.lidx2',
    'jibri.dat',
  ]
  for (const f of [...doomed, ...kept]) {
    await mkdir(join(host, f, '..'), { recursive: true })
    await writeFile(join(host, f), 'x')
  }
  execFileSync('sh', [
    '-c',
    `set -eu\n${fn}\npurge "$1" jibri\npurge "$2" jibri`,
    'sh',
    host,
    join(root, 'absent'),
  ])
  const left = execFileSync('find', [host, '-type', 'f'], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .map((l) => l.slice(host.length + 1))
    .sort()
  assert.deepEqual(left, [...kept].sort())
})

test('recorder-setup on: deletes nothing, root only prepares the folder, and the certificate is created only when absent', () => {
  const exec = recorderSetupExec(true)
  assert.equal(exec.user, 'root')
  const [sh, c, root, name, asProsody, ...rest] = exec.command
  assert.deepEqual([sh, c, name, rest], ['sh', '-c', 'recorder-setup', []])
  for (const script of [root, asProsody]) {
    assert.doesNotMatch(script, /purge|-delete|\/var\/lib\/prosody/)
  }
  // Root follows no link and leaves everything that writes to prosody's user.
  assert.doesNotMatch(root, /openssl|\bmv\b|chown -R|chown (?!-h )/)
  // /config becomes root's, then the link check, before root makes or hands
  // over anything.
  const rootLines = root.split('\n')
  const at = (re: RegExp) => {
    const i = rootLines.findIndex((l) => re.test(l))
    assert.ok(i >= 0, `${re} in the root stage`)
    return i
  }
  const order = [
    at(/^chown -h 0:0 '\/config'$/),
    at(/^chmod 755 '\/config'$/),
    at(/^if \[ -L '\/config\/certs' \]; then .*exit 1; fi$/),
    at(/^mkdir -p '\/config\/certs'$/),
    at(/^chown -h s6:s6 '\/config\/certs'$/),
    at(/^for f in .*chown -h s6:s6/),
    at(/^exec \/command\/s6-setuidgid s6 sh -c "\$1"$/),
  ]
  assert.deepEqual(
    order,
    [...order].sort((a, b) => a - b),
  )
  assert.equal(rootLines.filter((l) => /\bmkdir\b/.test(l)).length, 1)
  assert.equal(rootLines.filter((l) => /\bchmod\b/.test(l)).length, 1)
  // The one openssl call sits inside the "missing" branch, and the certificate
  // it makes can sign nothing.
  const lines = asProsody.split('\n')
  const opens = lines.flatMap((l, i) => (/openssl/.test(l) ? [i] : []))
  assert.equal(opens.length, 1)
  const ifAt = lines.indexOf(
    "if [ ! -s '/config/certs/auth.meet.jitsi.crt' ] || [ ! -s '/config/certs/auth.meet.jitsi.key' ]; then",
  )
  const fiAt = lines.indexOf('fi')
  assert.ok(ifAt >= 0 && ifAt < opens[0] && opens[0] < fiAt)
  assert.match(lines[opens[0]], /-addext 'basicConstraints=critical,CA:FALSE'/)
  assert.match(
    lines[opens[0]],
    /-addext 'keyUsage=critical,digitalSignature,keyEncipherment'/,
  )
  assert.match(lines[opens[0]], /-addext 'extendedKeyUsage=serverAuth'/)
  assert.match(
    lines[opens[0]],
    /-addext 'subjectAltName=DNS:auth\.meet\.jitsi'/,
  )
})

function rotateRig(
  opts: {
    recording?: boolean
    register?: string
    save?: string
    purge?: boolean
    restart?: boolean
    // What the switch reads after an off rotation's save.
    onNow?: boolean
  } = {},
) {
  const calls: string[] = []
  let n = 0
  const run = rotateRecorderAccounts({
    recording: opts.recording ?? true,
    recordingNow: async () => {
      calls.push('read switch')
      return opts.onNow ?? false
    },
    newPassword: () => `pw${++n}`,
    register: async (user, host, password) => {
      calls.push(`register ${user}@${host} ${password}`)
      if (opts.register === user) throw new Error(`register ${user}`)
    },
    purge: async () => {
      calls.push('purge')
      if (opts.purge) throw new Error('purge')
    },
    save: async (passwords) => {
      calls.push(`save ${JSON.stringify(passwords)}`)
      if (opts.save && opts.save in passwords) throw new Error('save')
    },
    restart: async () => {
      calls.push('restart')
      if (opts.restart) throw new Error('restart')
    },
  })
  return { run, calls }
}

test('rotate: each password is registered, then saved, one account at a time', async () => {
  const { run, calls } = rotateRig()
  await run
  assert.deepEqual(calls, [
    'register jibri@auth.meet.jitsi pw1',
    'save {"JIBRI_XMPP_PASSWORD":"pw1"}',
    'register recorder@hidden.meet.jitsi pw2',
    'save {"JIBRI_RECORDER_PASSWORD":"pw2"}',
  ])
})

test('rotate: a password whose register fails is never saved', async () => {
  const first = rotateRig({ register: 'jibri' })
  await assert.rejects(first.run, /register jibri/)
  assert.deepEqual(first.calls, ['register jibri@auth.meet.jitsi pw1'])

  const second = rotateRig({ register: 'recorder' })
  await assert.rejects(second.run, /register recorder/)
  assert.deepEqual(second.calls, [
    'register jibri@auth.meet.jitsi pw1',
    'save {"JIBRI_XMPP_PASSWORD":"pw1"}',
    'register recorder@hidden.meet.jitsi pw2',
  ])
})

test('rotate: a failed save after its register still restarts Jitsi Meet', async () => {
  const { run, calls } = rotateRig({ save: 'JIBRI_XMPP_PASSWORD' })
  await assert.rejects(run, /save/)
  assert.deepEqual(calls, [
    'register jibri@auth.meet.jitsi pw1',
    'save {"JIBRI_XMPP_PASSWORD":"pw1"}',
    'restart',
  ])
})

test('rotate: a failed restart does not hide the save error', async () => {
  const { run, calls } = rotateRig({
    save: 'JIBRI_XMPP_PASSWORD',
    restart: true,
  })
  await assert.rejects(run, /^Error: save$/)
  assert.deepEqual(calls, [
    'register jibri@auth.meet.jitsi pw1',
    'save {"JIBRI_XMPP_PASSWORD":"pw1"}',
    'restart',
  ])
})

test('rotate with Recording off: purges, then saves both passwords at once, and registers nothing', async () => {
  const { run, calls } = rotateRig({ recording: false })
  await run
  assert.deepEqual(calls, [
    'purge',
    'save {"JIBRI_XMPP_PASSWORD":"pw1","JIBRI_RECORDER_PASSWORD":"pw2"}',
    'read switch',
  ])

  const failed = rotateRig({ recording: false, purge: true })
  await assert.rejects(failed.run, /purge/)
  assert.deepEqual(failed.calls, ['purge'])

  const unsaved = rotateRig({ recording: false, save: 'JIBRI_XMPP_PASSWORD' })
  await assert.rejects(unsaved.run, /save/)
  assert.deepEqual(unsaved.calls, [
    'purge',
    'save {"JIBRI_XMPP_PASSWORD":"pw1","JIBRI_RECORDER_PASSWORD":"pw2"}',
  ])
})

test('rotate with Recording off: if it was turned on meanwhile, the saved passwords are registered, then Jitsi Meet restarts', async () => {
  const { run, calls } = rotateRig({ recording: false, onNow: true })
  await run
  assert.deepEqual(calls, [
    'purge',
    'save {"JIBRI_XMPP_PASSWORD":"pw1","JIBRI_RECORDER_PASSWORD":"pw2"}',
    'read switch',
    'register jibri@auth.meet.jitsi pw1',
    'register recorder@hidden.meet.jitsi pw2',
    'restart',
  ])

  const failed = rotateRig({ recording: false, onNow: true, register: 'jibri' })
  await assert.rejects(failed.run, /register jibri/)
  assert.deepEqual(failed.calls.slice(-1), [
    'register jibri@auth.meet.jitsi pw1',
  ])
})

test('restart only a service StartOS means to be running', () => {
  const st = (main: string) => ({ desired: { main } })
  assert.equal(isRunning(st('running')), true)
  assert.equal(isRunning(st('restarting')), true)
  for (const main of ['stopped', 'backing-up', 'updating'])
    assert.equal(isRunning(st(main)), false, main)
  assert.equal(isRunning(null), false)
})

// A throwaway self-signed certificate for test.invalid; it secures nothing.
const certPem = [
  '-----BEGIN CERTIFICATE-----',
  'MIIBZDCCAQqgAwIBAgIUHAPY/3rCfTkQilPfTlNzrzg6D/4wCgYIKoZIzj0EAwIw',
  'FzEVMBMGA1UEAwwMdGVzdC5pbnZhbGlkMCAXDTI2MTEyNzA2NTQzNloYDzIxMjYx',
  'MTAzMDY1NDM2WjAXMRUwEwYDVQQDDAx0ZXN0LmludmFsaWQwWTATBgcqhkjOPQIB',
  'BggqhkjOPQMBBwNCAATyQvvnbU22lm0SW3I2lKfisbjU9fbOy3PXGKEZRWdv6l+N',
  '+cBQICjoy9yUPtxuoQUkUWxcnaXrrVRAE4uY0PizozIwMDAdBgNVHQ4EFgQUOhdE',
  '0nzEdru8qROA3r4jCj3kmLAwDwYDVR0TAQH/BAUwAwEB/zAKBggqhkjOPQQDAgNI',
  'ADBFAiEAkpni65kn6dntnh1+OJ5kIiDfjliNZLgYNlT0zv8mA68CIHBAPSI3X+ZU',
  'GEDxClq9njpeRNjt5UJ30heAbuWihsNX',
  '-----END CERTIFICATE-----',
].join('\n')

test('details show the certificate only when it is exactly one PEM certificate', () => {
  assert.equal(singleCertificatePem(certPem), certPem)
  assert.equal(singleCertificatePem(`\n${certPem}\n\n`), certPem)
  assert.equal(singleCertificatePem(certPem.replace(/\n/g, '\r\n')), certPem)
  const notOne = [
    '',
    'hello',
    `${certPem}\n${certPem}`,
    `${certPem}\nextra`,
    `secret\n${certPem}`,
    certPem.replace(/CERTIFICATE/g, 'PRIVATE KEY'),
    // Right shape, but not a certificate.
    certPem.replace(/^MIIB/m, 'AAAA'),
  ]
  for (const text of notOne)
    assert.equal(singleCertificatePem(text), null, JSON.stringify(text))
})

// Bounded: a regression that blocks on the fifo fails here instead of hanging the run.
test(
  'details read the certificate without following a link, and only a small regular file',
  { timeout: 10_000 },
  async (t) => {
    const root = await mkdtemp(join(tmpdir(), 'recorder-cert-'))
    t.after(() => rm(root, { recursive: true, force: true }))
    const dir = join(root, 'certs')
    await mkdir(dir)
    const name = 'auth.meet.jitsi.crt'
    const elsewhere = join(root, 'elsewhere.crt')
    await writeFile(elsewhere, certPem)

    assert.equal(await readRecorderCert(dir, name), 'missing')
    assert.equal(await readRecorderCert(join(root, 'none'), name), 'missing')

    await symlink(elsewhere, join(dir, name))
    assert.equal(await readRecorderCert(dir, name), 'unreadable', 'file link')
    await rm(join(dir, name))

    execFileSync('mkfifo', [join(dir, name)])
    assert.equal(await readRecorderCert(dir, name), 'unreadable', 'fifo')
    await rm(join(dir, name))

    await mkdir(join(dir, name))
    assert.equal(await readRecorderCert(dir, name), 'unreadable', 'folder')
    await rm(join(dir, name), { recursive: true })

    await writeFile(
      join(dir, name),
      certPem + '\n' + ' '.repeat(recorderCertMaxBytes),
    )
    assert.equal(await readRecorderCert(dir, name), 'unreadable', 'too large')

    await writeFile(join(dir, name), 'not a certificate')
    assert.equal(await readRecorderCert(dir, name), 'unreadable', 'not PEM')

    await writeFile(join(dir, name), certPem + '\n')
    assert.deepEqual(await readRecorderCert(dir, name), { pem: certPem })

    const linked = join(root, 'linked')
    await symlink(dir, linked)
    assert.equal(await readRecorderCert(linked, name), 'unreadable', 'dir link')
  },
)
