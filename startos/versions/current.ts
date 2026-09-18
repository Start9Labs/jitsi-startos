import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11248:1',
  releaseNotes: {
    en_US: `**Fixes**

- The video bridge now advertises only the public IPv4 address you published on the **Video Bridge Media** interface. It no longer falls back to an address discovered by an external STUN server, which on a VPN-routed server could be the VPN's exit address — the wrong one for participants to send media to. With no published address the bridge advertises none, and remote participants require a configured Coturn relay.
- Added a **Video Bridge Address** health check reporting which of those states the bridge is in.

**Upstream**, from 2.0.11248:

- Added message moderation for conferences and breakout rooms
- Added advanced audio settings
- Improved video quality and codec configuration, including mobile P2P codec selection and Firefox AV1 compatibility
- Improved Prosody handling of local IPv6 traffic

[Full upstream release notes](https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248)`,
    es_ES: `**Correcciones**

- El puente de vídeo ahora anuncia únicamente la dirección IPv4 pública que hayas publicado en la interfaz **Video Bridge Media**. Ya no recurre a una dirección descubierta por un servidor STUN externo, que en un servidor enrutado por VPN podía ser la dirección de salida de la VPN: la dirección equivocada para que los participantes envíen medios. Sin una dirección publicada, el puente no anuncia ninguna y los participantes remotos necesitan un relé Coturn configurado.
- Se añadió una comprobación de estado **Video Bridge Address** que indica en cuál de esos estados se encuentra el puente.

**Actualización de origen**, desde 2.0.11248:

- Se añadió la moderación de mensajes para conferencias y salas para grupos
- Se añadieron ajustes avanzados de audio
- Se mejoró la configuración de la calidad de vídeo y los códecs, incluida la selección de códecs P2P para móviles y la compatibilidad de AV1 con Firefox
- Se mejoró la gestión del tráfico IPv6 local por parte de Prosody

[Notas completas de la versión](https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248)`,
    de_DE: `**Fehlerbehebungen**

- Die Videobridge kündigt jetzt ausschließlich die öffentliche IPv4-Adresse an, die Sie auf der Schnittstelle **Video Bridge Media** veröffentlicht haben. Sie greift nicht mehr auf eine von einem externen STUN-Server ermittelte Adresse zurück, die auf einem über VPN geleiteten Server die Ausgangsadresse des VPN sein konnte — die falsche Adresse, an die Teilnehmer Medien senden. Ohne veröffentlichte Adresse kündigt die Bridge keine an, und entfernte Teilnehmer benötigen ein konfiguriertes Coturn-Relay.
- Neue Statusprüfung **Video Bridge Address**, die meldet, in welchem dieser Zustände sich die Bridge befindet.

**Upstream**, aus 2.0.11248:

- Nachrichtenmoderation für Konferenzen und Gruppenräume hinzugefügt
- Erweiterte Audioeinstellungen hinzugefügt
- Videoqualität und Codec-Konfiguration verbessert, einschließlich der mobilen P2P-Codec-Auswahl und Firefox-AV1-Kompatibilität
- Prosodys Verarbeitung von lokalem IPv6-Verkehr verbessert

[Vollständige Versionshinweise](https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248)`,
    pl_PL: `**Poprawki**

- Most wideo rozgłasza teraz wyłącznie publiczny adres IPv4 opublikowany przez Ciebie w interfejsie **Video Bridge Media**. Nie korzysta już z adresu wykrytego przez zewnętrzny serwer STUN, którym na serwerze kierowanym przez VPN mógł być adres wyjściowy VPN — niewłaściwy adres do wysyłania mediów przez uczestników. Bez opublikowanego adresu most nie rozgłasza żadnego, a zdalni uczestnicy wymagają skonfigurowanego przekaźnika Coturn.
- Dodano kontrolę stanu **Video Bridge Address**, która informuje, w którym z tych stanów jest most.

**Zmiany źródłowe**, z 2.0.11248:

- Dodano moderowanie wiadomości podczas konferencji i w pokojach grupowych
- Dodano zaawansowane ustawienia dźwięku
- Ulepszono jakość obrazu i konfigurację kodeków, w tym wybór kodeka P2P na urządzeniach mobilnych oraz zgodność AV1 z przeglądarką Firefox
- Ulepszono obsługę lokalnego ruchu IPv6 przez Prosody

[Pełne informacje o wydaniu](https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11248)`,
    fr_FR: `**Corrections**

- Le pont vidéo annonce désormais uniquement l'adresse IPv4 publique que vous avez publiée sur l'interface **Video Bridge Media**. Il ne se rabat plus sur une adresse découverte par un serveur STUN externe, qui sur un serveur routé par VPN pouvait être l'adresse de sortie du VPN — la mauvaise adresse pour que les participants y envoient leurs médias. Sans adresse publiée, le pont n'en annonce aucune et les participants distants ont besoin d'un relais Coturn configuré.
- Ajout d'une vérification d'état **Video Bridge Address** indiquant dans lequel de ces états se trouve le pont.

**Amont**, depuis 2.0.11248 :

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
