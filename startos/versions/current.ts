import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11509.1:3',
  releaseNotes: {
    en_US:
      'Meetings among participants on your local network now carry audio and video when the Video Bridge Media interface has no public IPv4.',
    es_ES:
      'Las reuniones entre participantes de tu red local ahora transmiten audio y vídeo cuando la interfaz Video Bridge Media no tiene IPv4 pública.',
    de_DE:
      'Besprechungen zwischen Teilnehmern in deinem lokalen Netzwerk übertragen jetzt Ton und Bild, wenn die Schnittstelle Video Bridge Media keine öffentliche IPv4 hat.',
    pl_PL:
      'Spotkania uczestników z Twojej sieci lokalnej przesyłają teraz dźwięk i obraz, gdy interfejs Video Bridge Media nie ma publicznego adresu IPv4.',
    fr_FR:
      'Les réunions entre participants de votre réseau local transmettent désormais le son et la vidéo lorsque l’interface Video Bridge Media n’a pas d’IPv4 publique.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
