import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort, uiInterfaceId } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Web UI (HTTP)
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

  // JVB media (UDP 10000)
  const jvbMulti = sdk.MultiHost.of(effects, 'jvb-media')
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
      masked: true,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    }),
  ])

  // TURN relay (UDP 3478)
  const turnMulti = sdk.MultiHost.of(effects, 'turn')
  const turnOrigin = await turnMulti.bindPort(3478, {
    protocol: null,
    preferredExternalPort: 3478,
    secure: { ssl: false },
    addSsl: null,
  })
  const turnReceipt = await turnOrigin.export([
    sdk.createInterface(effects, {
      name: i18n('TURN Relay'),
      id: 'turn',
      description: i18n('TURN relay server for NAT traversal'),
      type: 'api',
      masked: true,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    }),
  ])

  return [uiReceipt, jvbReceipt, turnReceipt]
})
