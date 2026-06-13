import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11031:0',
  releaseNotes: {
    en_US: `Updated Jitsi Meet to stable-11031 and Coturn to 4.12.0.

- Jitsi Meet → stable-11031: upgraded whiteboard; "mid" RTP header extension now disabled by default.
- Coturn → 4.12.0: higher-throughput UDP relay paths and a new multiplex-peer mode.

Full changelog: https://github.com/jitsi/docker-jitsi-meet/compare/stable-10978...stable-11031`,
    es_ES: `Actualiza Jitsi Meet a stable-11031 y Coturn a 4.12.0.

- Jitsi Meet → stable-11031: pizarra actualizada; la extensión de cabecera RTP "mid" ahora está desactivada por defecto.
- Coturn → 4.12.0: rutas de retransmisión UDP de mayor rendimiento y un nuevo modo multiplex-peer.

Registro de cambios completo: https://github.com/jitsi/docker-jitsi-meet/compare/stable-10978...stable-11031`,
    de_DE: `Aktualisiert Jitsi Meet auf stable-11031 und Coturn auf 4.12.0.

- Jitsi Meet → stable-11031: Whiteboard aktualisiert; die RTP-Header-Erweiterung "mid" ist jetzt standardmäßig deaktiviert.
- Coturn → 4.12.0: durchsatzstärkere UDP-Relay-Pfade und ein neuer multiplex-peer-Modus.

Vollständiges Änderungsprotokoll: https://github.com/jitsi/docker-jitsi-meet/compare/stable-10978...stable-11031`,
    pl_PL: `Aktualizuje Jitsi Meet do stable-11031 i Coturn do 4.12.0.

- Jitsi Meet → stable-11031: zaktualizowana tablica; rozszerzenie nagłówka RTP "mid" jest teraz domyślnie wyłączone.
- Coturn → 4.12.0: wydajniejsze ścieżki przekazywania UDP i nowy tryb multiplex-peer.

Pełny dziennik zmian: https://github.com/jitsi/docker-jitsi-meet/compare/stable-10978...stable-11031`,
    fr_FR: `Met à jour Jitsi Meet vers stable-11031 et Coturn vers 4.12.0.

- Jitsi Meet → stable-11031 : tableau blanc mis à jour ; l'extension d'en-tête RTP « mid » est désormais désactivée par défaut.
- Coturn → 4.12.0 : chemins de relais UDP à plus haut débit et nouveau mode multiplex-peer.

Journal des modifications complet : https://github.com/jitsi/docker-jitsi-meet/compare/stable-10978...stable-11031`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
