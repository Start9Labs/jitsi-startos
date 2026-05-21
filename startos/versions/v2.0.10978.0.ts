import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const v_2_0_10978_0 = VersionInfo.of({
  version: '2.0.10978:0',
  releaseNotes: {
    en_US: 'Bumps Jitsi Meet → stable-10978.',
    es_ES: 'Actualiza Jitsi Meet → stable-10978.',
    de_DE: 'Aktualisiert Jitsi Meet → stable-10978.',
    pl_PL: 'Aktualizuje Jitsi Meet → stable-10978.',
    fr_FR: 'Met à jour Jitsi Meet → stable-10978.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
