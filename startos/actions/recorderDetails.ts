import { createHash, X509Certificate } from 'node:crypto'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  encodeRecorderConnection,
  jibriBreweryMuc,
  jibriRecorderUser,
  jibriXmppUser,
  readRecorderCert,
  recorderCertFile,
  recorderCertVolumeDir,
  recorderXmppServers,
  uiHostId,
  uiInterfaceId,
  uiPort,
  xmppConfig,
  xmppHiddenDomain,
  xmppHostId,
  xmppPort,
} from '../utils'

const shown = {
  masked: true,
  copyable: true,
  qr: false,
}

export const recorderDetails = sdk.Action.withoutInput(
  'recorder-connection-details',

  async ({ effects }) => {
    const store = await storeJson.read().const(effects)
    return {
      name: i18n('Recorder Connection Details'),
      description: i18n(
        'Show what a Jibri recorder on another server needs to record meetings here.',
      ),
      warning: null,
      allowedStatuses: 'any',
      group: null,
      visibility:
        store?.ENABLE_RECORDING && store.RECORDING_REMOTE
          ? 'enabled'
          : {
              disabled: i18n(
                'Turn on Recording and "Allow recorders on other servers" in the Recording action first.',
              ),
            },
    }
  },

  async ({ effects }) => {
    const store = await storeJson.read().once()
    if (!store) throw new Error('store.json not found')

    // Off the binding, not the interface: it carries the port StartOS
    // assigned, which need not be the one prosody listens on.
    const servers = await sdk.host
      .getOwn(effects, xmppHostId, (host) =>
        recorderXmppServers(host?.bindings[xmppPort]?.addresses),
      )
      .once()

    // Jibri's browser opens meetings here, so prefer a public domain over TLS.
    const urls = await sdk.host
      .getOwn(effects, uiHostId, (host) => {
        const addresses = host?.bindings[uiPort]?.interfaces[
          uiInterfaceId
        ]?.addressInfo.nonLocal.filter({ predicate: (h) => h.ssl })
        if (!addresses) return []
        const domains = addresses
          .filter({ visibility: 'public', kind: 'domain' })
          .format()
        return domains.length
          ? domains
          : addresses.filter({ exclude: { kind: 'plugin' } }).format()
      })
      .once()

    const cert = await readRecorderCert(
      sdk.volumes.main.subpath(recorderCertVolumeDir),
      recorderCertFile,
    )

    if (!servers.length || !urls.length || typeof cert !== 'object')
      return {
        version: '1',
        title: i18n('Recorder Connection Details'),
        message: !servers.length
          ? i18n(
              'No private address is enabled on the "Recorder XMPP" interface. Enable one, then run this action again.',
            )
          : !urls.length
            ? i18n(
                'The Web UI has no HTTPS address a recorder could open meetings at.',
              )
            : i18n(
                'The recorder certificate is not ready. Start Jitsi Meet with Recording on, then run this action again.',
              ),
        result: null,
      }

    const env = [
      `XMPP_SERVER=${servers[0]}`,
      ...servers.slice(1).map((s) => `# or XMPP_SERVER=${s}`),
      `XMPP_DOMAIN=${xmppConfig.XMPP_DOMAIN}`,
      `XMPP_AUTH_DOMAIN=${xmppConfig.XMPP_AUTH_DOMAIN}`,
      `XMPP_INTERNAL_MUC_DOMAIN=${xmppConfig.XMPP_INTERNAL_MUC_DOMAIN}`,
      `XMPP_MUC_DOMAIN=${xmppConfig.XMPP_MUC_DOMAIN}`,
      `XMPP_HIDDEN_DOMAIN=${xmppHiddenDomain}`,
      `JIBRI_BREWERY_MUC=${jibriBreweryMuc}`,
      `JIBRI_XMPP_USER=${jibriXmppUser}`,
      `JIBRI_XMPP_PASSWORD=${store.JIBRI_XMPP_PASSWORD}`,
      `JIBRI_RECORDER_USER=${jibriRecorderUser}`,
      `JIBRI_RECORDER_PASSWORD=${store.JIBRI_RECORDER_PASSWORD}`,
      `PUBLIC_URL=${urls[0]}`,
      ...urls.slice(1).map((u) => `# or PUBLIC_URL=${u}`),
      'XMPP_TRUST_ALL_CERTS=false',
    ].join('\n')

    return {
      version: '1',
      title: i18n('Recorder Connection Details'),
      message: i18n(
        'Keep these secret: they let a recorder join any meeting here, and its control account administers this Jitsi.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Connection string'),
            description: i18n(
              'For the Jibri service on another StartOS server: paste it into its Connect to Jitsi action.',
            ),
            value: encodeRecorderConnection({
              v: 1,
              xmppServers: servers,
              publicUrls: urls,
              xmppPassword: store.JIBRI_XMPP_PASSWORD,
              recorderPassword: store.JIBRI_RECORDER_PASSWORD,
              certSha256: new X509Certificate(cert.pem).fingerprint256,
              webCaSpki: createHash('sha256')
                .update(
                  new X509Certificate(
                    await sdk.getRootCa(effects),
                  ).publicKey.export({ type: 'spki', format: 'der' }),
                )
                .digest('base64'),
            }),
            ...shown,
            qr: true,
            launchable: false,
          },
          {
            type: 'multiline',
            name: i18n('Jibri environment'),
            description: i18n(
              "For a Jibri that doesn't run StartOS: its .env file. Keep XMPP_TRUST_ALL_CERTS=false and give it the certificate below.",
            ),
            value: env,
            ...shown,
            filename: 'jibri.env',
          },
          {
            type: 'multiline',
            name: i18n('XMPP certificate'),
            description: i18n(
              "For a Jibri that doesn't run StartOS: mount it into /usr/local/share/ca-certificates/ in its container.",
            ),
            value: cert.pem,
            masked: false,
            copyable: true,
            qr: false,
            filename: 'xmpp.crt',
          },
        ],
      },
    }
  },
)
