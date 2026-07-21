import { sdk } from './sdk'
import { coturnId, coturnVersionRange } from './utils'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => ({
  [coturnId]: {
    kind: 'running',
    versionRange: coturnVersionRange,
    // No healthChecks: Coturn's own `coturn` check reports `disabled` until the
    // user attaches a public domain, which would show a permanent "unmet
    // dependency" warning on Jitsi even though Jitsi degrades gracefully to
    // relay-less operation. Coturn's own Public Domain check prompts the user.
    healthChecks: [],
  },
}))
