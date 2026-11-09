import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11248.3:2',
  releaseNotes: {
    en_US:
      "Participants on IPv6 can now send audio and video straight to the video bridge over the server's public IPv6 address.",
    es_ES:
      'Los participantes con IPv6 ahora pueden enviar audio y vídeo directamente al puente de vídeo a través de la dirección IPv6 pública del servidor.',
    de_DE:
      'Teilnehmer mit IPv6 können Audio und Video jetzt direkt über die öffentliche IPv6-Adresse des Servers an die Videobrücke senden.',
    pl_PL:
      'Uczestnicy korzystający z IPv6 mogą teraz przesyłać dźwięk i obraz bezpośrednio do mostka wideo przez publiczny adres IPv6 serwera.',
    fr_FR:
      'Les participants en IPv6 peuvent désormais envoyer l’audio et la vidéo directement au pont vidéo via l’adresse IPv6 publique du serveur.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
