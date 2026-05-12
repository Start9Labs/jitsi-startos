import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_2_0_10888_4 = VersionInfo.of({
  version: '2.0.10888:4',
  releaseNotes: {
    en_US: `**Bumps**

- coturn → 4.11.0
- start-sdk → 1.5.0`,
    es_ES: `**Actualizaciones**

- coturn → 4.11.0
- start-sdk → 1.5.0`,
    de_DE: `**Aktualisierungen**

- coturn → 4.11.0
- start-sdk → 1.5.0`,
    pl_PL: `**Aktualizacje**

- coturn → 4.11.0
- start-sdk → 1.5.0`,
    fr_FR: `**Mises à jour**

- coturn → 4.11.0
- start-sdk → 1.5.0`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
