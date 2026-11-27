import { X509Certificate } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { recorderCredentials } from './fileModels/recorderCredentials.json'
import { storeJson } from './fileModels/store.json'
import { turnserverConf } from './fileModels/turnserver.conf'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { utils } from '@start9labs/start-sdk'
import {
  coturnConfPath,
  coturnDataDir,
  coturnMounts,
  followXmppExposure,
  javaEnv,
  jicofoEnv,
  jicofoHealthPort,
  jicofoMounts,
  jvbHttpPort,
  jvbMediaHostId,
  jvbMediaInterfaceId,
  jvbMediaPort,
  jvbMounts,
  prosodyEnv,
  prosodyMounts,
  prosodyPort,
  prosodyStorageMountpoint,
  prosodyUser,
  readRecorderCert,
  recorderCertFile,
  recorderCertVolumeDir,
  recorderSetupExec,
  renderTurnserverConf,
  turnHostId,
  turnInterfaceId,
  turnPort,
  uiHostId,
  uiInterfaceId,
  uiPort,
  webEnv,
  webMounts,
  xmppExposure,
  xmppExposureResult,
  xmppHostId,
  xmppPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Jitsi Meet!'))

  const store = await storeJson.read().const(effects)
  if (!store) {
    throw new Error('store.json not found')
  }
  const {
    JICOFO_AUTH_PASSWORD,
    JVB_AUTH_PASSWORD,
    TURN_SECRET,
    XMPP_MODULES,
    XMPP_MUC_MODULES,
    XMPP_SPEAKERSTATS_MODULES,
  } = store
  const recording = store.ENABLE_RECORDING
    ? {
        JIBRI_XMPP_PASSWORD: store.JIBRI_XMPP_PASSWORD,
        JIBRI_RECORDER_PASSWORD: store.JIBRI_RECORDER_PASSWORD,
      }
    : null

  // Static mappings preserve StartOS's enabled IP/port pairs.
  const jvbPublic = await sdk.host
    .getOwn(effects, jvbMediaHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === jvbMediaInterfaceId)
      const hostnames = (kind: 'ipv4' | 'ipv6') =>
        iface?.addressInfo
          .filter({ visibility: 'public', kind })
          .format('hostname-info') ?? []
      const addresses = host?.bindings[jvbMediaPort]?.addresses
      return {
        // LAN, VPN and the container bridge, so participants there reach the
        // bridge too.
        privateIpv4: addresses
          ? addresses.available.filter(
              (h) =>
                h.metadata.kind === 'ipv4' &&
                !h.public &&
                h.metadata.gateway !== 'lo' &&
                utils.isAddressEnabled(addresses, h),
            )
          : [],
        ipv4: hostnames('ipv4'),
        // Global unicast only (2000::/3); StartOS forwards no other v6 to the container.
        ipv6: hostnames('ipv6').filter((h) => /^[23]/.test(h.hostname)),
      }
    })
    .const()
  const jvbPublicIps = jvbPublic.ipv4.map((h) => h.hostname)
  const jvbAdvertiseIps = [
    ...jvbPublic.ipv4,
    ...jvbPublic.ipv6,
    ...jvbPublic.privateIpv4,
  ].map((h) => `${h.hostname}#${h.port ?? jvbMediaPort}`)

  const uiClearnetExposure = sdk.host.getOwn(effects, uiHostId, (host) => {
    const iface =
      host &&
      Object.values(host.bindings)
        .flatMap((b) => Object.values(b.interfaces))
        .find((i) => i.id === uiInterfaceId)
    return !!iface?.addressInfo
      .filter({ visibility: 'public' })
      .filter({ exclude: { kind: 'plugin' } })
      .format('hostname-info').length
  })
  let uiIsClearnetPublic = await uiClearnetExposure.once()
  uiClearnetExposure.onChange((next) => {
    uiIsClearnetPublic = !!next
    return { cancel: false }
  })

  // Feeds only the xmpp-exposure check, so it is watched rather than read
  // with .const(), which would restart every daemon when an address is toggled.
  const xmppState =
    recording && store.RECORDING_REMOTE
      ? await followXmppExposure(
          sdk.host.getOwn(effects, xmppHostId, (host) =>
            xmppExposure(host?.bindings[xmppPort]?.addresses),
          ),
        )
      : null

  const turnEndpoint = await sdk.host
    .getOwn(effects, turnHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === turnInterfaceId)
      const domains =
        iface?.addressInfo
          .filter({ visibility: 'public', kind: 'domain' })
          .hostnames.filter((h) => h.port != null) ?? []
      const domain = domains[0]?.hostname
      if (!domain) return null
      const forDomain = domains.filter((h) => h.hostname === domain)
      return {
        domain,
        turnPort: forDomain.find((h) => !h.ssl)?.port ?? null,
        turnsPort: forDomain.find((h) => h.ssl)?.port ?? null,
      }
    })
    .const()

  const turn =
    turnEndpoint && TURN_SECRET
      ? { ...turnEndpoint, secret: TURN_SECRET }
      : null

  if (turn) {
    await turnserverConf.write(
      effects,
      renderTurnserverConf({
        realm: turn.domain,
        externalIps: jvbPublicIps ?? [],
        containerIp: await sdk.getContainerIp(effects).const(),
        secret: turn.secret,
      }),
    )
  }

  const coturnSub = sdk.SubContainer.of(
    effects,
    { imageId: 'coturn' },
    coturnMounts,
    'coturn-sub',
  )

  const webSub = sdk.SubContainer.of(
    effects,
    { imageId: 'web' },
    webMounts,
    'web-sub',
  )

  const prosodySub = await sdk.SubContainer.of(
    effects,
    { imageId: 'prosody' },
    prosodyMounts,
    'prosody-sub',
  )

  // A Jibri on this server reads its credentials from the `public` volume,
  // and pins the certificate by this fingerprint.
  if (recording) {
    const { command, user } = recorderSetupExec(true)
    await prosodySub.execFail(command, { user })
    const cert = await readRecorderCert(
      sdk.volumes.main.subpath(recorderCertVolumeDir),
      recorderCertFile,
    )
    if (typeof cert !== 'object')
      throw new Error(`recorder certificate is ${cert}`)
    await recorderCredentials.write(effects, {
      xmppPassword: recording.JIBRI_XMPP_PASSWORD,
      recorderPassword: recording.JIBRI_RECORDER_PASSWORD,
      certSha256: new X509Certificate(cert.pem).fingerprint256,
    })
  } else {
    await rm(recorderCredentials.path, { force: true })
  }

  return sdk.Daemons.of(effects)
    .addOneshot('nginx-patch', {
      subcontainer: webSub,
      // Write custom nginx config before web daemon starts.
      // Increases BOSH proxy timeout to prevent client disconnections.
      // Runs as root because the volume is root-owned and web reads it as `s6`.
      exec: {
        command: [
          'sh',
          '-c',
          'mkdir -p /config/nginx && echo "proxy_read_timeout 3600;" > /config/nginx/custom-meet.conf',
        ],
        user: 'root',
      },
      requires: [],
    })
    .addOneshot('prosody-chown', {
      subcontainer: prosodySub,
      // Only the account store. The custom modules folder stays root-owned:
      // prosody reads it and never needs to write the code it loads.
      exec: {
        command: [
          'chown',
          '-R',
          `${prosodyUser}:${prosodyUser}`,
          prosodyStorageMountpoint,
        ],
        user: 'root',
      },
      requires: [],
    })
    .addOneshot('recorder-setup', {
      subcontainer: prosodySub,
      exec: recording ? { command: ['true'] } : recorderSetupExec(false),
      requires: ['prosody-chown'],
    })
    .addDaemon('prosody', {
      subcontainer: prosodySub,
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: prosodyEnv({
          JICOFO_AUTH_PASSWORD,
          JVB_AUTH_PASSWORD,
          turn,
          modules: {
            XMPP_MODULES,
            XMPP_MUC_MODULES,
            XMPP_SPEAKERSTATS_MODULES,
          },
          recording,
        }),
      },
      ready: {
        display: i18n('XMPP Server'),
        gracePeriod: 30_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, prosodyPort, {
            successMessage: i18n('The XMPP server is ready'),
            errorMessage: i18n('The XMPP server is not ready'),
          }),
      },
      requires: ['prosody-chown', 'recorder-setup'],
    })
    .addDaemon('web', {
      subcontainer: webSub,
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: webEnv({
          recording: !!recording,
          liveStreaming: store.ENABLE_LIVESTREAMING,
        }),
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: ['nginx-patch', 'prosody'],
    })
    .addDaemon('jicofo', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'jicofo' },
        jicofoMounts,
        'jicofo-sub',
      ),
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: jicofoEnv({ JICOFO_AUTH_PASSWORD, recording: !!recording }),
      },
      ready: {
        display: i18n('Conference Focus'),
        fn: () =>
          sdk.healthCheck.checkWebUrl(
            effects,
            `http://127.0.0.1:${jicofoHealthPort}/about/health`,
            {
              successMessage: i18n('The conference focus is ready'),
              errorMessage: i18n('The conference focus is not ready'),
            },
          ),
      },
      requires: ['prosody'],
    })
    .addDaemon('jvb', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'jvb' },
        jvbMounts,
        'jvb-sub',
      ),
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: {
          ...javaEnv,
          JVB_AUTH_USER: 'jvb',
          JVB_AUTH_PASSWORD,
          JVB_PORT: String(jvbMediaPort),
          JVB_BREWERY_MUC: 'jvbbrewery',
          // Required for LAN mappings; also exposes the container's host candidates.
          JVB_ADVERTISE_PRIVATE_CANDIDATES: 'true',
          // The advertised address comes from the published interface, full
          // stop. ice4j's STUN mapping harvester reports whatever the box's
          // default route exits from — a VPN exit, an upstream NAT — which is
          // not what StartOS published, and upstream keeps it enabled by
          // default (meet-jit-si-turnrelay.jitsi.net:443) ADDITIVELY: left on,
          // its reflexive address is offered alongside JVB_ADVERTISE_IPS, and
          // in place of it whenever no public IPv4 is published. Without a
          // published address the bridge now offers no public candidate at
          // all, which the `jvb-public-address` check below reports.
          JVB_DISABLE_STUN: 'true',
          ...(jvbAdvertiseIps.length
            ? { JVB_ADVERTISE_IPS: jvbAdvertiseIps.join(',') }
            : {}),
        },
      },
      ready: {
        display: i18n('Video Bridge'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, jvbHttpPort, {
            successMessage: i18n('The video bridge is ready'),
            errorMessage: i18n('The video bridge is not ready'),
          }),
      },
      requires: ['prosody'],
    })
    .addHealthCheck('jvb-public-address', {
      ready: {
        display: i18n('Video Bridge Address'),
        trigger: sdk.trigger.statusTrigger(30_000, {
          starting: 5_000,
          failure: 5_000,
        }),
        fn: () =>
          jvbPublicIps?.length
            ? {
                result: 'success' as const,
                message: i18n(
                  'The video bridge advertises its published public IPv4.',
                ),
              }
            : uiIsClearnetPublic
              ? {
                  result: 'failure' as const,
                  message: i18n(
                    'Required for clearnet. Enable a public IPv4 address in the "Video Bridge Media" interface.',
                  ),
                }
              : {
                  result: 'disabled' as const,
                  message: i18n(
                    'No public IPv4 published. The video bridge is reachable only on your local network.',
                  ),
                },
      },
      requires: ['jvb'],
    })
    .addOneshot('coturn-chown', () =>
      turn
        ? {
            subcontainer: coturnSub,
            exec: {
              command: ['chown', '-R', 'nobody:nogroup', coturnDataDir],
              user: 'root',
            },
            requires: [],
          }
        : null,
    )
    .addDaemon('coturn', () =>
      turn
        ? {
            subcontainer: coturnSub,
            exec: {
              command: ['turnserver', '-c', coturnConfPath],
              user: 'nobody',
            },
            ready: {
              display: i18n('TURN Relay'),
              fn: () =>
                sdk.healthCheck.checkPortListening(effects, turnPort, {
                  successMessage: i18n('The TURN relay is ready'),
                  errorMessage: i18n('The TURN relay is not ready'),
                }),
            },
            requires: ['coturn-chown'],
          }
        : null,
    )
    .addHealthCheck('turn-address', {
      ready: {
        display: i18n('TURN Relay Address'),
        trigger: sdk.trigger.statusTrigger(30_000, {
          starting: 5_000,
          failure: 5_000,
        }),
        fn: () =>
          turn?.turnPort && turn.turnsPort
            ? {
                result: 'success' as const,
                message: i18n(
                  'TURN and TURN over TLS are published on a public domain.',
                ),
              }
            : uiIsClearnetPublic
              ? {
                  result: 'failure' as const,
                  message: i18n(
                    'Required for clearnet. Add a public domain to the "TURN Relay" interface and enable both of its addresses.',
                  ),
                }
              : {
                  result: 'disabled' as const,
                  message: i18n('The TURN relay has no public domain.'),
                },
      },
      requires: [],
    })
    .addHealthCheck('xmpp-exposure', () =>
      xmppState
        ? {
            ready: {
              display: i18n('Recorder XMPP Address'),
              trigger: sdk.trigger.statusTrigger(30_000, {
                starting: 5_000,
                failure: 5_000,
              }),
              fn: () => xmppExposureResult(xmppState()),
            },
            requires: [],
          }
        : null,
    )
})
