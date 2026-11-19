import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11509:2',
  releaseNotes: {
    en_US: 'Updates the bundled Coturn relay to 4.19.1.',
    es_ES: 'Actualiza el relé Coturn incluido a 4.19.1.',
    de_DE: 'Aktualisiert das mitgelieferte Coturn-Relay auf 4.19.1.',
    pl_PL: 'Aktualizuje dołączony przekaźnik Coturn do wersji 4.19.1.',
    fr_FR: 'Met à jour le relais Coturn intégré vers la version 4.19.1.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
