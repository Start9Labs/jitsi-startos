import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
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

// Each value is named after the Jibri variable it fills, so it pastes
// straight into docker-jitsi-meet's .env.
const value = (
  name: string,
  v: string,
  opts: { description?: string; masked?: boolean } = {},
) => ({
  type: 'single' as const,
  name,
  description: opts.description ?? null,
  value: v,
  masked: opts.masked ?? false,
  copyable: true,
  qr: false,
  launchable: false,
})

export const recorderDetails = sdk.Action.withoutInput(
  'recorder-connection-details',

  async ({ effects }) => ({
    name: i18n('Recorder Connection Details'),
    description: i18n(
      'Show the addresses, domains, accounts and passwords an external Jibri recorder needs.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: (await storeJson.read((s) => s.ENABLE_RECORDING).const(effects))
      ? 'enabled'
      : {
          disabled: i18n(
            'Turn on the external recorder in the Recording action first.',
          ),
        },
  }),

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

    // Written by the recorder-setup oneshot on the first start with recording
    // on, so it is missing only until then.
    const cert = await readRecorderCert(
      sdk.volumes.main.subpath(recorderCertVolumeDir),
      recorderCertFile,
    )

    const message = servers.length
      ? i18n(
          'Set each value below as the Jibri environment variable of the same name, and have Jibri trust the certificate. Keep both passwords secret: anyone holding the control password administers this Jitsi and can watch and hear every meeting.',
        )
      : i18n(
          'No private address is enabled on the "Recorder XMPP" interface. Enable one, then run this action again.',
        )

    return {
      version: '1',
      title: i18n('Recorder Connection Details'),
      message,
      result: {
        type: 'group',
        value: [
          ...servers.map((s) =>
            value('XMPP_SERVER', s, {
              description: i18n(
                'Use any one of these that your recorder can reach.',
              ),
            }),
          ),
          value('XMPP_DOMAIN', xmppConfig.XMPP_DOMAIN),
          value('XMPP_AUTH_DOMAIN', xmppConfig.XMPP_AUTH_DOMAIN),
          value(
            'XMPP_INTERNAL_MUC_DOMAIN',
            xmppConfig.XMPP_INTERNAL_MUC_DOMAIN,
          ),
          value('XMPP_MUC_DOMAIN', xmppConfig.XMPP_MUC_DOMAIN),
          value('XMPP_HIDDEN_DOMAIN', xmppHiddenDomain),
          value('JIBRI_BREWERY_MUC', jibriBreweryMuc),
          value('JIBRI_XMPP_USER', jibriXmppUser),
          value('XMPP_TRUST_ALL_CERTS', 'false', {
            description: i18n(
              'Jibri trusts any XMPP certificate unless this is false, so anyone between it and this server could capture the control password.',
            ),
          }),
          value(
            i18n('XMPP certificate'),
            cert === 'missing'
              ? i18n(
                  'Not created yet. Start Jitsi Meet with recording on, then run this action again.',
                )
              : cert === 'unreadable'
                ? i18n(
                    'Not readable: the certificate file is not a single PEM certificate. Replace it as the instructions describe, then run this action again.',
                  )
                : cert.pem,
            {
              description: i18n(
                'Save as a .crt file and mount it into /usr/local/share/ca-certificates/ in the Jibri container, so Jibri can verify it is talking to this server.',
              ),
            },
          ),
          value('JIBRI_XMPP_PASSWORD', store.JIBRI_XMPP_PASSWORD, {
            description: i18n(
              "Jibri's control account: a full Jitsi and Prosody administrator with access to every meeting's audio and video. Treat it like a root password.",
            ),
            masked: true,
          }),
          value('JIBRI_RECORDER_USER', jibriRecorderUser),
          value('JIBRI_RECORDER_PASSWORD', store.JIBRI_RECORDER_PASSWORD, {
            description: i18n(
              "The account Jibri's browser joins meetings with. Participants do not see it.",
            ),
            masked: true,
          }),
          ...urls.map((u) =>
            value('PUBLIC_URL', u, {
              description: i18n(
                'Where the recorder opens meetings. Use one whose certificate it trusts.',
              ),
            }),
          ),
        ],
      },
    }
  },
)
