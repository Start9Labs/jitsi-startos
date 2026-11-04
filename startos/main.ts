import { storeJson } from './fileModels/store.json'
import { turnserverConf } from './fileModels/turnserver.conf'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  coturnConfPath,
  coturnDataDir,
  coturnMounts,
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
  renderTurnserverConf,
  turnHostId,
  turnInterfaceId,
  turnPort,
  uiHostId,
  uiInterfaceId,
  uiPort,
  webMounts,
  xmppConfig,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Jitsi Meet!'))

  const store = await storeJson.read().const(effects)
  if (!store) {
    throw new Error('store.json not found')
  }
  const { JICOFO_AUTH_PASSWORD, JVB_AUTH_PASSWORD, TURN_SECRET } = store

  // Resolve public IPs from the JVB media interface so JVB advertises
  // the correct addresses instead of the STUN-discovered one
  const jvbPublicIps = await sdk.host
    .getOwn(effects, jvbMediaHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === jvbMediaInterfaceId)
      return iface?.addressInfo
        .filter({ visibility: 'public', kind: 'ipv4' })
        .format('hostname-info')
        .map((h) => h.hostname)
    })
    .const()

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

  const commonEnv = {
    TZ: 'UTC',
    ...xmppConfig,
  }

  const webSub = sdk.SubContainer.of(
    effects,
    { imageId: 'web' },
    webMounts,
    'web-sub',
  )

  const prosodySub = sdk.SubContainer.of(
    effects,
    { imageId: 'prosody' },
    prosodyMounts,
    'prosody-sub',
  )

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
    .addDaemon('prosody', {
      subcontainer: prosodySub,
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: prosodyEnv({
          JICOFO_AUTH_PASSWORD,
          JVB_AUTH_PASSWORD,
          turn,
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
      requires: ['prosody-chown'],
    })
    .addDaemon('web', {
      subcontainer: webSub,
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: {
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
        },
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
        env: {
          ...commonEnv,
          ENABLE_AUTH: '1',
          ENABLE_GUESTS: '1',
          JICOFO_AUTH_USER: 'focus',
          JICOFO_AUTH_PASSWORD,
        },
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
          ...commonEnv,
          JVB_AUTH_USER: 'jvb',
          JVB_AUTH_PASSWORD,
          JVB_PORT: String(jvbMediaPort),
          JVB_BREWERY_MUC: 'jvbbrewery',
          COLIBRI_REST_ENABLED: 'true',
          // Don't advertise docker-internal host candidates (10.x LXC bridge,
          // fc00::/7 IPv6 ULA). Clients can't route to them, and offering
          // them as high-priority pairs can stall ICE/DTLS on some networks.
          JVB_ADVERTISE_PRIVATE_CANDIDATES: 'false',
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
          ...(jvbPublicIps?.length
            ? { JVB_ADVERTISE_IPS: jvbPublicIps.join(',') }
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
})
