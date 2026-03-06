import { T, utils } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const uiPort = 80
export const uiInterfaceId = 'ui'

export function getPassword() {
  return utils.getDefaultString({
    charset: 'a-z,A-Z,0-9',
    len: 32,
  })
}

export async function getInterfaceUrls(effects: T.Effects) {
  return sdk.serviceInterface
    .getOwn(
      effects,
      uiInterfaceId,
      (i) => i?.addressInfo?.nonLocal.format() || [],
    )
    .const()
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
