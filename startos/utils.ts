import { utils } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 80
export const turnPort = 3478
export const jvbMediaPort = 10000
export const jvbHttpPort = 8080
export const jicofoHealthPort = 8888

export const uiInterfaceId = 'ui'
export const turnInterfaceId = 'turn'
export const jvbMediaInterfaceId = 'jvb-media'

export function getPassword() {
  return utils.getDefaultString({
    charset: 'a-z,A-Z,0-9',
    len: 32,
  })
}

export const xmppConfig = {
  XMPP_DOMAIN: 'meet.jitsi',
  XMPP_AUTH_DOMAIN: 'auth.meet.jitsi',
  XMPP_MUC_DOMAIN: 'muc.meet.jitsi',
  XMPP_INTERNAL_MUC_DOMAIN: 'internal-muc.meet.jitsi',
  XMPP_GUEST_DOMAIN: 'guest.meet.jitsi',
  XMPP_SERVER: 'localhost',
}

export const prosodyMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'prosody',
  mountpoint: '/config',
  readonly: false,
})

export const webMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'web',
  mountpoint: '/config',
  readonly: false,
})

export const jicofoMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'jicofo',
  mountpoint: '/config',
  readonly: false,
})

export const jvbMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'jvb',
  mountpoint: '/config',
  readonly: false,
})

export const coturnMounts = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: 'coturn',
  mountpoint: '/var/lib/coturn',
  readonly: false,
})

export const prosodyPort = 5280

export function prosodyEnv(passwords: {
  JICOFO_AUTH_PASSWORD: string
  JVB_AUTH_PASSWORD: string
  TURN_SECRET: string
}) {
  return {
    TZ: 'UTC',
    ...xmppConfig,
    ENABLE_AUTH: '1',
    ENABLE_GUESTS: '1',
    AUTH_TYPE: 'internal',
    JICOFO_AUTH_USER: 'focus',
    JICOFO_AUTH_PASSWORD: passwords.JICOFO_AUTH_PASSWORD,
    JVB_AUTH_USER: 'jvb',
    JVB_AUTH_PASSWORD: passwords.JVB_AUTH_PASSWORD,
    TURN_SECRET: passwords.TURN_SECRET,
  }
}
