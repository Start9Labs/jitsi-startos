import { sdk } from './sdk'
import { coturnId, coturnVersionRange } from './utils'

const coturn = sdk.Dependency.required(coturnId, {
  description:
    'Provides a TURN/STUN relay so calls connect through NAT and restrictive firewalls',
  metadata: {
    title: 'Coturn',
    icon: 'https://raw.githubusercontent.com/Start9Labs/coturn-startos/d67ecaca5800a87e3300ce44c62484888f35d51b/icon.svg',
  },
  kind: 'running',
  versionRange: coturnVersionRange,
  // No healthChecks: Coturn's own `coturn` check reports `disabled` until the
  // user attaches a public domain, which would show a permanent "unmet
  // dependency" warning on Jitsi even though Jitsi degrades gracefully to
  // relay-less operation. Coturn's own Public Domain check prompts the user.
  healthChecks: [],
})

export const dependencies = sdk.Dependencies.of().addDependency(coturn)
