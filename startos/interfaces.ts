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
        addXForwardedHeaders: false,
        auth: null,
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

  return [uiReceipt, jvbReceipt, turnReceipt]
})
