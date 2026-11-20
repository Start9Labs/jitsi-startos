import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11509.1:0',
  releaseNotes: {
    en_US:
      'Updated the Jitsi Meet container images to stable-11509-1, a rebuild of stable-11509 with no listed changes. Full notes: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11509-1',
    es_ES:
      'Actualiza las imágenes de contenedor de Jitsi Meet a stable-11509-1, una recompilación de stable-11509 sin cambios anunciados. Notas completas: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11509-1',
    de_DE:
      'Aktualisiert die Jitsi-Meet-Container-Images auf stable-11509-1, einen Neubau von stable-11509 ohne angekündigte Änderungen. Vollständige Versionshinweise: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11509-1',
    pl_PL:
      'Aktualizuje obrazy kontenerów Jitsi Meet do stable-11509-1, ponownej kompilacji stable-11509 bez ogłoszonych zmian. Pełne informacje o wydaniu: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11509-1',
    fr_FR:
      'Met à jour les images de conteneur Jitsi Meet vers stable-11509-1, une recompilation de stable-11509 sans changement annoncé. Notes de version complètes : https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11509-1',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
