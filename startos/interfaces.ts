import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  jvbMediaHostId,
  jvbMediaInterfaceId,
  jvbMediaPort,
  turnHostId,
  turnInterfaceId,
  turnPort,
  turnsPort,
  uiHostId,
  uiInterfaceId,
  uiPort,
  xmppHostId,
  xmppInterfaceId,
  xmppPort,
} from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Web UI
  const uiMulti = sdk.MultiHost.of(effects, uiHostId)
  const uiOrigin = await uiMulti.bindPort(uiPort, {
    protocol: 'http',
  })
  const uiReceipt = await uiOrigin.export([
    sdk.createInterface(effects, {
      name: i18n('Web UI'),
      id: uiInterfaceId,
      description: i18n('The web interface of Jitsi Meet'),
      type: 'ui',
      masked: false,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    }),
  ])

  // JVB media
  const jvbMulti = sdk.MultiHost.of(effects, jvbMediaHostId)
  const jvbOrigin = await jvbMulti.bindPort(jvbMediaPort, {
    protocol: null,
    preferredExternalPort: jvbMediaPort,
    secure: { ssl: false },
    addSsl: null,
  })
  const jvbReceipt = await jvbOrigin.export([
    sdk.createInterface(effects, {
      name: i18n('Video Bridge Media'),
      id: jvbMediaInterfaceId,
      description: i18n('WebRTC media transport for video and audio'),
      type: 'api',
      masked: false,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    }),
  ])

  const turnOrigin = await sdk.MultiHost.of(effects, turnHostId).bindPort(
    turnPort,
    {
      protocol: null,
      preferredExternalPort: turnPort,
      secure: { ssl: false },
      addSsl: {
        preferredExternalPort: turnsPort,
        alpn: null,
      },
    },
  )
  const turnReceipt = await turnOrigin.export([
    sdk.createInterface(effects, {
      name: i18n('TURN Relay'),
      id: turnInterfaceId,
      description: i18n(
        'Relays media for participants who cannot reach the video bridge directly',
      ),
      type: 'api',
      masked: false,
      schemeOverride: { ssl: 'turns', noSsl: 'turn' },
      username: null,
      path: '',
      query: {},
    }),
  ])

  const receipts = [uiReceipt, jvbReceipt, turnReceipt]

  // Bound only while the Recording action is on; a pass that skips it
  // disables the binding and keeps its port and the user's address choices.
  // Raw TCP like the media port: prosody negotiates TLS itself (STARTTLS,
  // which it requires on this port), so StartOS adds no TLS leg.
  const recording = await storeJson
    .read((s) => s.ENABLE_RECORDING)
    .const(effects)
  if (recording) {
    const xmppOrigin = await sdk.MultiHost.of(effects, xmppHostId).bindPort(
      xmppPort,
      {
        protocol: null,
        preferredExternalPort: xmppPort,
        secure: { ssl: false },
        addSsl: null,
      },
    )
    receipts.push(
      await xmppOrigin.export([
        sdk.createInterface(effects, {
          name: i18n('Recorder XMPP'),
          id: xmppInterfaceId,
          description: i18n(
            'XMPP for an external Jibri recorder. Keep it on your private network.',
          ),
          type: 'api',
          masked: false,
          schemeOverride: null,
          username: null,
          path: '',
          query: {},
        }),
      ]),
    )
  }

  return receipts
})
