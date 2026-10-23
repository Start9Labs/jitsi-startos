import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11248.1:0',
  releaseNotes: {
    en_US:
      'Updated Jitsi Meet images to stable-11248-1: fixes video bridge shutdown and IPv6 address mapping, and filters direct XMPP messages outside room-controlled routes. Updated start-sdk to 3.1.0 with startup and health-check fixes. Full upstream notes: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248-1',
    es_ES:
      'Imágenes de Jitsi Meet actualizadas a stable-11248-1: corrige el apagado del puente de vídeo y el mapeo de direcciones IPv6, y filtra los mensajes XMPP directos fuera de las rutas controladas por las salas. start-sdk actualizado a 3.1.0 con correcciones de inicio y comprobaciones de salud. Notas completas: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248-1',
    de_DE:
      'Jitsi-Meet-Images auf stable-11248-1 aktualisiert: behebt das Herunterfahren der Videobrücke und die IPv6-Adresszuordnung und filtert direkte XMPP-Nachrichten außerhalb raumgesteuerter Routen. start-sdk auf 3.1.0 mit Korrekturen für Start und Zustandsprüfungen aktualisiert. Vollständige Hinweise: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248-1',
    pl_PL:
      'Zaktualizowano obrazy Jitsi Meet do stable-11248-1: poprawiono wyłączanie mostu wideo i mapowanie adresów IPv6 oraz dodano filtrowanie bezpośrednich wiadomości XMPP poza trasami kontrolowanymi przez pokoje. Zaktualizowano start-sdk do 3.1.0 z poprawkami uruchamiania i kontroli stanu. Pełne informacje: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248-1',
    fr_FR:
      'Images Jitsi Meet mises à jour vers stable-11248-1 : corrige l’arrêt du pont vidéo et le mappage des adresses IPv6, et filtre les messages XMPP directs hors des routes contrôlées par les salles. start-sdk mis à jour vers 3.1.0 avec des correctifs de démarrage et de contrôles de santé. Notes complètes : https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248-1',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
