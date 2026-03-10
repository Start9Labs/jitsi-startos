import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  coturnMounts,
  jicofoMounts,
  jvbMounts,
  prosodyMounts,
  turnInterfaceId,
  turnPort,
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
  const { JICOFO_AUTH_PASSWORD, JVB_AUTH_PASSWORD, TURN_SECRET, turnEnabled } =
    store

  // If TURN is enabled, resolve the public domain from the turn interface
  let turnHost: string | undefined
  if (turnEnabled) {
    turnHost = await sdk.serviceInterface
      .getOwn(
        effects,
        turnInterfaceId,
        (i) =>
          i?.addressInfo
            ?.filter({ visibility: 'public', kind: 'domain' })
            .format('hostname-info')
            .at(0)?.hostname,
      )
      .const()
  }

  const commonEnv = {
    TZ: 'UTC',
    ...xmppConfig,
  }

  return sdk.Daemons.of(effects)
    .addDaemon('prosody', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'prosody' },
        prosodyMounts,
        'prosody-sub',
      ),
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          ...commonEnv,
          // Require authentication to create rooms; guests can join
          ENABLE_AUTH: '1',
          ENABLE_GUESTS: '1',
          AUTH_TYPE: 'internal',
          JICOFO_AUTH_USER: 'focus',
          JICOFO_AUTH_PASSWORD,
          JVB_AUTH_USER: 'jvb',
          JVB_AUTH_PASSWORD,
          TURN_SECRET,
        },
      },
      ready: {
        display: i18n('XMPP Server'),
        gracePeriod: 30_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, 5280, {
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
      // Three states: running (enabled + domain), idle (enabled, no domain), idle (disabled).
      // Coturn listens on plain TCP; StartOS terminates TLS in front of it.
      exec:
        turnEnabled && turnHost
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
        fn:
          turnEnabled && turnHost
            ? () =>
                sdk.healthCheck.checkPortListening(effects, 3478, {
                  successMessage: i18n('The TURN server is ready'),
                  errorMessage: i18n('The TURN server is not ready'),
                })
            : turnEnabled
              ? async () => ({
                  result: 'failure',
                  message: i18n(
                    'Waiting for a public domain on the TURN interface. Please configure a domain in StartOS.',
                  ),
                })
              : async () => ({
                  result: 'disabled',
                  message: null,
                }),
      },
      requires: [],
    })
    .addDaemon('web', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'web' },
        webMounts,
        'web-sub',
      ),
      exec: {
        command: sdk.useEntrypoint(),
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
          // know to request relay candidates from this server
          ...(turnHost
            ? {
                TURN_ENABLE: '1',
                TURN_HOST: turnHost,
                TURN_PORT: '443',
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
      requires: ['prosody'],
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
        env: {
          ...commonEnv,
          JICOFO_AUTH_USER: 'focus',
          JICOFO_AUTH_PASSWORD,
        },
      },
      ready: {
        display: i18n('Conference Focus'),
        fn: () =>
          sdk.healthCheck.checkWebUrl(
            effects,
            'http://127.0.0.1:8888/about/health',
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
        env: {
          ...commonEnv,
          JVB_AUTH_USER: 'jvb',
          JVB_AUTH_PASSWORD,
          JVB_PORT: '10000',
          JVB_BREWERY_MUC: 'jvbbrewery',
          COLIBRI_REST_ENABLED: 'true',
        },
      },
      ready: {
        display: i18n('Video Bridge'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, 8080, {
            successMessage: i18n('The video bridge is ready'),
            errorMessage: i18n('The video bridge is not ready'),
          }),
      },
      requires: ['prosody'],
    })
})
