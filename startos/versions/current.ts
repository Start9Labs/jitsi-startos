import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11248.3:0',
  releaseNotes: {
    en_US:
      'Updated Jitsi Meet images to stable-11248-3, reverting the enablement of Prosody’s direct-message filter. Updated start-sdk to 3.1.1 with subcontainer startup fixes. Full upstream changes: https://github.com/jitsi/docker-jitsi-meet/compare/stable-11248-2...stable-11248-3',
    es_ES:
      'Imágenes de Jitsi Meet actualizadas a stable-11248-3, revirtiendo la activación del filtro de mensajes directos de Prosody. start-sdk actualizado a 3.1.1 con correcciones de inicio de subcontenedores. Cambios completos: https://github.com/jitsi/docker-jitsi-meet/compare/stable-11248-2...stable-11248-3',
    de_DE:
      'Jitsi-Meet-Images auf stable-11248-3 aktualisiert; die Aktivierung des Direktnachrichtenfilters von Prosody wurde zurückgenommen. start-sdk auf 3.1.1 mit Korrekturen beim Start von Subcontainern aktualisiert. Vollständige Änderungen: https://github.com/jitsi/docker-jitsi-meet/compare/stable-11248-2...stable-11248-3',
    pl_PL:
      'Zaktualizowano obrazy Jitsi Meet do stable-11248-3, wycofując włączenie filtra wiadomości bezpośrednich w Prosody. Zaktualizowano start-sdk do 3.1.1 z poprawkami uruchamiania podkontenerów. Pełne zmiany: https://github.com/jitsi/docker-jitsi-meet/compare/stable-11248-2...stable-11248-3',
    fr_FR:
      'Images Jitsi Meet mises à jour vers stable-11248-3, annulant l’activation du filtre de messages directs de Prosody. start-sdk mis à jour vers 3.1.1 avec des correctifs de démarrage des sous-conteneurs. Changements complets : https://github.com/jitsi/docker-jitsi-meet/compare/stable-11248-2...stable-11248-3',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
