import { VersionInfo } from '@start9labs/start-sdk'

export const v_2_0_10741_0_b0 = VersionInfo.of({
  version: '2.0.10741:0-beta.0',
  releaseNotes: {
    en_US: 'Initial release for StartOS 0.4.0',
    es_ES: 'Lanzamiento inicial para StartOS 0.4.0',
    de_DE: 'Erstveröffentlichung für StartOS 0.4.0',
    pl_PL: 'Pierwsze wydanie dla StartOS 0.4.0',
    fr_FR: 'Première version pour StartOS 0.4.0',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: async ({ effects }) => {},
  },
})
