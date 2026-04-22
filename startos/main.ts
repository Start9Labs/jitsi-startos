import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  coturnMounts,
  jicofoHealthPort,
  jicofoMounts,
  jvbHttpPort,
  jvbMediaInterfaceId,
  jvbMediaPort,
  jvbMounts,
  prosodyEnv,
  prosodyMounts,
  prosodyPort,
  turnInterfaceId,
  turnPort,
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
  const jvbPublicIps = await sdk.serviceInterface
    .getOwn(effects, jvbMediaInterfaceId, (i) =>
      i?.addressInfo
        ?.filter({ visibility: 'public', kind: 'ipv4' })
        .format('hostname-info')
        .map((h) => h.hostname),
    )
    .const()

  // If the UI is publicly accessible but JVB has no public IPv4, calls will fail
  const uiIsPublic = await sdk.serviceInterface
    .getOwn(effects, uiInterfaceId, (i) =>
      !!i?.addressInfo
        ?.filter({ visibility: 'public' })
        .format('hostname-info').length,
    )
    .const()
  const jvbMissingPublicIp = uiIsPublic && !jvbPublicIps?.length

  // Resolve the public TLS-wrapped TURN endpoint (if one is configured).
  // StartOS terminates TLS in front of coturn, so we advertise the SSL entry.
  const turnEndpoint = await sdk.serviceInterface
    .getOwn(effects, turnInterfaceId, (i) => {
      const entry = i?.addressInfo
        ?.filter({ visibility: 'public', kind: 'domain' })
        .format('hostname-info')
        .find((h) => h.ssl && h.port != null)
      return entry ? { host: entry.hostname, port: entry.port! } : null
    })
    .const()

  const commonEnv = {
    TZ: 'UTC',
    ...xmppConfig,
  }

  const webSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'web' },
    webMounts,
    'web-sub',
  )

  return sdk.Daemons.of(effects)
    .addOneshot('nginx-patch', {
      subcontainer: webSub,
      // Write custom nginx config before web daemon starts.
      // Increases BOSH proxy timeout to prevent client disconnections.
      exec: {
        command: [
          'sh',
          '-c',
          'mkdir -p /config/nginx && echo "proxy_read_timeout 3600;" > /config/nginx/custom-meet.conf',
        ],
      },
      requires: [],
    })
    .addDaemon('prosody', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'prosody' },
        prosodyMounts,
        'prosody-sub',
      ),
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: prosodyEnv({
          JICOFO_AUTH_PASSWORD,
          JVB_AUTH_PASSWORD,
          TURN_SECRET,
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
      requires: [],
    })
    .addDaemon('coturn', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'coturn' },
        coturnMounts,
        'coturn-sub',
      ),
      // Coturn listens on plain TCP; StartOS terminates TLS in front of it.
      // If no public domain is configured yet, coturn idles.
      exec: turnEndpoint
        ? {
            command: [
              'turnserver',
              '-n',
              '--log-file=stdout',
              '--lt-cred-mech', // time-limited credentials via shared secret
              `--realm=${xmppConfig.XMPP_DOMAIN}`,
              `--static-auth-secret=${TURN_SECRET}`,
              `--listening-port=${turnPort}`,
            ],
          }
        : { command: ['sleep', 'infinity'] },
      ready: {
        display: i18n('TURN Server'),
        fn: turnEndpoint
          ? () =>
              sdk.healthCheck.checkPortListening(effects, 3478, {
                successMessage: i18n('The TURN server is ready'),
                errorMessage: i18n('The TURN server is not ready'),
              })
          : async () =>
              uiIsPublic
                ? {
                    result: 'failure' as const,
                    message: i18n(
                      'Required to support mobile carriers, hotel WiFi, and UDP-blocking firewalls. To enable, add a public domain to the "TURN Relay" interface.',
                    ),
                  }
                : {
                    result: 'disabled' as const,
                    message: i18n('Only needed if using a public domain.'),
                  },
      },
      requires: [],
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
          // TURN config is injected into the client-side config.js so browsers
          // know to request relay candidates from this server. Port comes from
          // the turn interface's SSL endpoint — the "preferred" external port
          // in interfaces.ts is not guaranteed.
          ...(turnEndpoint
            ? {
                TURN_ENABLE: '1',
                TURN_HOST: turnEndpoint.host,
                TURN_PORT: String(turnEndpoint.port),
                TURN_TRANSPORT: 'tcp',
              }
            : {}),
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
      subcontainer: await sdk.SubContainer.of(
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
      subcontainer: await sdk.SubContainer.of(
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
          ...(jvbPublicIps?.length
            ? { JVB_ADVERTISE_IPS: jvbPublicIps.join(',') }
            : {}),
        },
      },
      ready: {
        display: i18n('Video Bridge'),
        fn: async () => {
          const portCheck = await sdk.healthCheck.checkPortListening(
            effects,
            jvbHttpPort,
            {
              successMessage: i18n('The video bridge is ready'),
              errorMessage: i18n('The video bridge is not ready'),
            },
          )
          if (portCheck.result !== 'success') return portCheck
          if (jvbMissingPublicIp) {
            return {
              result: 'failure' as const,
              message: i18n(
                'Required for clearnet. Enable a public IPv4 address in the "Video Bridge Media" interface.',
              ),
            }
          }
          return portCheck
        },
      },
      requires: ['prosody'],
    })
})
