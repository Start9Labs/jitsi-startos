import { VersionInfo } from '@start9labs/start-sdk'

export const v_2_0_10888_2 = VersionInfo.of({
  version: '2.0.10888:2',
  releaseNotes: {
    en_US: 'Update coturn TURN server to 4.10.0. Internal updates (start-sdk 1.2.0).',
    es_ES: 'Actualización del servidor TURN coturn a 4.10.0. Actualizaciones internas (start-sdk 1.2.0).',
    de_DE: 'Update des coturn-TURN-Servers auf 4.10.0. Interne Aktualisierungen (start-sdk 1.2.0).',
    pl_PL: 'Aktualizacja serwera TURN coturn do 4.10.0. Aktualizacje wewnętrzne (start-sdk 1.2.0).',
    fr_FR: 'Mise à jour du serveur TURN coturn vers 4.10.0. Mises à jour internes (start-sdk 1.2.0).',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
