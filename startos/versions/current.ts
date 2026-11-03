import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11248.3:0',
  releaseNotes: {
    en_US:
      'Updated Jitsi Meet to stable-11248-3. Full upstream changes: https://github.com/jitsi/docker-jitsi-meet/compare/stable-11248-2...stable-11248-3',
    es_ES:
      'Jitsi Meet actualizado a stable-11248-3. Cambios completos: https://github.com/jitsi/docker-jitsi-meet/compare/stable-11248-2...stable-11248-3',
    de_DE:
      'Jitsi Meet auf stable-11248-3 aktualisiert. Vollständige Änderungen: https://github.com/jitsi/docker-jitsi-meet/compare/stable-11248-2...stable-11248-3',
    pl_PL:
      'Zaktualizowano Jitsi Meet do stable-11248-3. Pełne zmiany: https://github.com/jitsi/docker-jitsi-meet/compare/stable-11248-2...stable-11248-3',
    fr_FR:
      'Jitsi Meet mis à jour vers stable-11248-3. Changements complets : https://github.com/jitsi/docker-jitsi-meet/compare/stable-11248-2...stable-11248-3',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
