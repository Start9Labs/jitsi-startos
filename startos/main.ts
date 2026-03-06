import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import {
  uiPort,
  xmppConfig,
  prosodyMounts,
  webMounts,
  jicofoMounts,
  jvbMounts,
  coturnMounts,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Jitsi Meet!'))

  const store = await storeJson.read().once()
  if (!store) throw new Error('store.json not found')

  const hostname = store.primaryUrl
    ? new URL(store.primaryUrl).hostname
    : ''

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
          JICOFO_AUTH_USER: 'focus',
          JICOFO_AUTH_PASSWORD: store.jicofoAuthPassword,
          JVB_AUTH_USER: 'jvb',
          JVB_AUTH_PASSWORD: store.jvbAuthPassword,
          TURN_SECRET: store.turnSecret,
        },
      },
      ready: {
        display: i18n('XMPP Server'),
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
      exec: {
        command: [
          'turnserver',
          '-n',
          '--log-file=stdout',
          '--lt-cred-mech',
          `--realm=${xmppConfig.XMPP_DOMAIN}`,
          `--static-auth-secret=${store.turnSecret}`,
          '--listening-port=3478',
          ...(hostname ? [`--external-ip=${hostname}`] : []),
        ],
      },
      ready: {
        display: i18n('TURN Server'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, 3478, {
            successMessage: i18n('The TURN server is ready'),
            errorMessage: i18n('The TURN server is not ready'),
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
          DISABLE_HTTPS: '1',
          XMPP_BOSH_URL_BASE: 'http://localhost:5280',
          ...(hostname
            ? {
                TURN_ENABLE: '1',
                TURN_HOST: hostname,
                TURN_PORT: '3478',
                TURN_TRANSPORT: 'udp',
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
          JICOFO_AUTH_PASSWORD: store.jicofoAuthPassword,
        },
      },
      ready: {
        display: i18n('Conference Focus'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, 8888, {
            successMessage: i18n('The conference focus is ready'),
            errorMessage: i18n('The conference focus is not ready'),
          }),
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
          JVB_AUTH_PASSWORD: store.jvbAuthPassword,
          JVB_PORT: '10000',
          JVB_BREWERY_MUC: 'jvbbrewery',
          COLIBRI_REST_ENABLED: 'true',
          ...(hostname ? { JVB_ADVERTISE_IPS: hostname } : {}),
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
