import { sdk } from './sdk'
import { coturnId, coturnVersionRange } from './utils'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => ({
  [coturnId]: {
    kind: 'running',
    versionRange: coturnVersionRange,
    healthChecks: ['coturn'],
  },
}))
