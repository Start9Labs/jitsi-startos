import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'jitsi',
  title: 'Jitsi Meet',
  license: 'Apache-2.0',
  packageRepo: 'https://github.com/Start9Labs/jitsi-startos',
  upstreamRepo: 'https://github.com/jitsi/docker-jitsi-meet',
  marketingUrl: 'https://jitsi.org/',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    web: {
      source: { dockerTag: 'jitsi/web:stable-11031' },
      arch: ['x86_64', 'aarch64'],
    },
    prosody: {
      source: { dockerTag: 'jitsi/prosody:stable-11031' },
      arch: ['x86_64', 'aarch64'],
    },
    jicofo: {
      source: { dockerTag: 'jitsi/jicofo:stable-11031' },
      arch: ['x86_64', 'aarch64'],
    },
    jvb: {
      source: { dockerTag: 'jitsi/jvb:stable-11031' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {
    coturn: {
      description:
        'Provides a TURN/STUN relay so calls connect through NAT and restrictive firewalls',
      optional: false,
      metadata: {
        title: 'Coturn',
        icon: 'https://raw.githubusercontent.com/Start9Labs/coturn-startos/d67ecaca5800a87e3300ce44c62484888f35d51b/icon.svg',
      },
    },
  },
})
