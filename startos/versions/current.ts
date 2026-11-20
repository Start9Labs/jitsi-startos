import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11509:3',
  releaseNotes: {
    en_US:
      "Other services on your server can no longer manage the video bridge's conferences.",
    es_ES:
      'Los demás servicios de tu servidor ya no pueden gestionar las conferencias del puente de video.',
    de_DE:
      'Andere Dienste auf deinem Server können die Konferenzen der Videobrücke nicht mehr verwalten.',
    pl_PL:
      'Inne usługi na Twoim serwerze nie mogą już zarządzać konferencjami mostka wideo.',
    fr_FR:
      'Les autres services de votre serveur ne peuvent plus gérer les conférences du pont vidéo.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
