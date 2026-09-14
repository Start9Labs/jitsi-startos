import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11248:0',
  releaseNotes: {
    en_US: `Updated Jitsi Meet to 2.0.11248.

- Added message moderation for conferences and breakout rooms
- Added advanced audio settings
- Improved video quality and codec configuration, including mobile P2P codec selection and Firefox AV1 compatibility
- Improved Prosody handling of local IPv6 traffic

[Full upstream release notes](https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248)`,
    es_ES: `Jitsi Meet actualizado a 2.0.11248.

- Se añadió la moderación de mensajes para conferencias y salas para grupos
- Se añadieron ajustes avanzados de audio
- Se mejoró la configuración de la calidad de vídeo y los códecs, incluida la selección de códecs P2P para móviles y la compatibilidad de AV1 con Firefox
- Se mejoró la gestión del tráfico IPv6 local por parte de Prosody

[Notas completas de la versión](https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248)`,
    de_DE: `Jitsi Meet wurde auf 2.0.11248 aktualisiert.

- Nachrichtenmoderation für Konferenzen und Gruppenräume hinzugefügt
- Erweiterte Audioeinstellungen hinzugefügt
- Videoqualität und Codec-Konfiguration verbessert, einschließlich der mobilen P2P-Codec-Auswahl und Firefox-AV1-Kompatibilität
- Prosodys Verarbeitung von lokalem IPv6-Verkehr verbessert

[Vollständige Versionshinweise](https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248)`,
    pl_PL: `Zaktualizowano Jitsi Meet do wersji 2.0.11248.

- Dodano moderowanie wiadomości podczas konferencji i w pokojach grupowych
- Dodano zaawansowane ustawienia dźwięku
- Ulepszono jakość obrazu i konfigurację kodeków, w tym wybór kodeka P2P na urządzeniach mobilnych oraz zgodność AV1 z przeglądarką Firefox
- Ulepszono obsługę lokalnego ruchu IPv6 przez Prosody

[Pełne informacje o wydaniu](https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248)`,
    fr_FR: `Mise à jour de Jitsi Meet vers la version 2.0.11248.

- Ajout de la modération des messages pour les conférences et les salles de répartition
- Ajout de paramètres audio avancés
- Amélioration de la qualité vidéo et de la configuration des codecs, notamment la sélection des codecs P2P sur mobile et la compatibilité AV1 avec Firefox
- Amélioration de la gestion du trafic IPv6 local par Prosody

[Notes de version complètes](https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248)`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
