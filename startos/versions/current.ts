import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.10978:1',
  releaseNotes: {
    en_US: 'Bumps Coturn → 4.12.0.',
    es_ES: 'Actualiza Coturn → 4.12.0.',
    de_DE: 'Aktualisiert Coturn → 4.12.0.',
    pl_PL: 'Aktualizuje Coturn → 4.12.0.',
    fr_FR: 'Met à jour Coturn → 4.12.0.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
