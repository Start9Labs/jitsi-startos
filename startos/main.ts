import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  coturnHostId,
  coturnId,
  coturnMountpoint,
  coturnSecretPath,
  coturnTurnInterfaceId,
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
  const { JICOFO_AUTH_PASSWORD, JVB_AUTH_PASSWORD } = store

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

  // If the UI is publicly accessible but JVB has no public IPv4, calls will fail
  const uiIsPublic = await sdk.host
    .getOwn(effects, uiHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === uiInterfaceId)
      return !!iface?.addressInfo
        .filter({ visibility: 'public' })
        .format('hostname-info').length
    })
    .const()
  const jvbMissingPublicIp = uiIsPublic && !jvbPublicIps?.length

  // Resolve the external Coturn package's public TURN endpoint. Coturn exposes a
  // single `turn` interface whose public-domain address set carries both the
  // plain turn: address (ssl:false, 3478) and the edge-terminated turns: address
  // (ssl:true, 5349); pick each by its ssl flag, both on the same domain.
  const coturnEndpoint = await sdk.host
    .get(effects, { hostId: coturnHostId, packageId: coturnId }, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === coturnTurnInterfaceId)
      const domains = iface
        ? iface.addressInfo
            .filter({ visibility: 'public', kind: 'domain' })
            .hostnames.filter((h) => h.port != null)
        : []
      const domain = domains[0]?.hostname ?? null
      if (!domain) return null
      const forDomain = domains.filter((h) => h.hostname === domain)
      return {
        domain,
        turnPort: forDomain.find((h) => !h.ssl)?.port ?? null,
        turnsPort: forDomain.find((h) => h.ssl)?.port ?? null,
      }
    })
    .const()

  // Read Coturn's shared TURN secret. Mount only the `shared` subpath read-only
  // into a throwaway container, so a missing Coturn can never break the prosody
  // daemon and we never touch the rest of Coturn's volume.
  const coturnSecret = await readCoturnSecret()
  async function readCoturnSecret(): Promise<string | null> {
    const reader = sdk.SubContainer.of(
      effects,
      { imageId: 'prosody' },
      sdk.Mounts.of().mountDependency({
        dependencyId: coturnId,
        volumeId: 'main',
        subpath: 'shared',
        mountpoint: coturnMountpoint,
        readonly: true,
      }),
      'coturn-secret-read',
    )
    try {
      const { stdout } = await reader.execFail(['cat', coturnSecretPath])
      return stdout.toString().trim() || null
    } catch {
      return null
    } finally {
      await reader.destroy().catch(() => {})
    }
  }

  const turn =
    coturnEndpoint && coturnSecret
      ? { ...coturnEndpoint, secret: coturnSecret }
      : null

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
