import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11248.2:0',
  releaseNotes: {
    en_US:
      'Updated Jitsi Meet images to stable-11248-2, restoring the lua-inspect dependency in Prosody. Full upstream notes: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248-2',
    es_ES:
      'Imágenes de Jitsi Meet actualizadas a stable-11248-2, restaurando la dependencia lua-inspect en Prosody. Notas completas: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248-2',
    de_DE:
      'Jitsi-Meet-Images auf stable-11248-2 aktualisiert; die Abhängigkeit lua-inspect in Prosody wurde wiederhergestellt. Vollständige Hinweise: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248-2',
    pl_PL:
      'Zaktualizowano obrazy Jitsi Meet do stable-11248-2, przywracając zależność lua-inspect w Prosody. Pełne informacje: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248-2',
    fr_FR:
      'Images Jitsi Meet mises à jour vers stable-11248-2, rétablissant la dépendance lua-inspect dans Prosody. Notes complètes : https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248-2',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
