import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { turnInterfaceId, turnPort, uiInterfaceId, uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const turnEnabled = await storeJson.read((s) => s.turnEnabled).const(effects)

  // Web UI
  const uiMulti = sdk.MultiHost.of(effects, 'ui-multi')
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
  const jvbMulti = sdk.MultiHost.of(effects, 'jvb-media-multi')
  const jvbOrigin = await jvbMulti.bindPort(10000, {
    protocol: null,
    preferredExternalPort: 10000,
    secure: { ssl: false },
    addSsl: null,
  })
  const jvbReceipt = await jvbOrigin.export([
    sdk.createInterface(effects, {
      name: i18n('Video Bridge Media'),
      id: 'jvb-media',
      description: i18n('WebRTC media transport for video and audio'),
      type: 'api',
      masked: false,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    }),
  ])

  const receipts = [uiReceipt, jvbReceipt]

  // TURN relay
  if (turnEnabled) {
    const turnMulti = sdk.MultiHost.of(effects, 'turn-multi')
    const turnOrigin = await turnMulti.bindPort(turnPort, {
      protocol: null,
      preferredExternalPort: turnPort,
      addSsl: {
        preferredExternalPort: turnPort,
        alpn: null,
        addXForwardedHeaders: false,
      },
      secure: null,
    })
    const turnReceipt = await turnOrigin.export([
      sdk.createInterface(effects, {
        name: i18n('TURN Relay'),
        id: turnInterfaceId,
        description: i18n('TURN relay server for NAT traversal'),
        type: 'api',
        masked: false,
        schemeOverride: null,
        username: null,
        path: '',
        query: {},
      }),
    ])
    receipts.push(turnReceipt)
  }

  return receipts
})
