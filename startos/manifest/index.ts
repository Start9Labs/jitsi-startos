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
  docsUrls: ['https://github.com/jitsi/handbook/tree/master/docs'],
  description: { short, long },
  volumes: ['main'],
  images: {
    web: {
      source: { dockerTag: 'jitsi/web:stable-10888' },
      arch: ['x86_64', 'aarch64'],
    },
    prosody: {
      source: { dockerTag: 'jitsi/prosody:stable-10888' },
      arch: ['x86_64', 'aarch64'],
    },
    jicofo: {
      source: { dockerTag: 'jitsi/jicofo:stable-10888' },
      arch: ['x86_64', 'aarch64'],
    },
    jvb: {
      source: { dockerTag: 'jitsi/jvb:stable-10888' },
      arch: ['x86_64', 'aarch64'],
    },
    coturn: {
      source: { dockerTag: 'coturn/coturn:4.10.0' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
