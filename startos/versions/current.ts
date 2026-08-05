import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11146:0',
  releaseNotes: {
    en_US: `Updated Jitsi Meet to stable-11146.

- Upstream now runs all containers as an unprivileged user instead of root, and XMPP accounts move to their own storage location. Your admin account carries over automatically on first start.
- Adds live audio translation wiring and virtual background v2; drops deprecated colibri websocket support.
- Full upstream release notes: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146`,
    es_ES: `Actualiza Jitsi Meet a stable-11146.

- Upstream ahora ejecuta todos los contenedores como usuario sin privilegios en lugar de root, y las cuentas XMPP se trasladan a su propia ubicación de almacenamiento. Tu cuenta de administrador se conserva automáticamente en el primer inicio.
- Añade la traducción de audio en vivo y el fondo virtual v2; elimina la compatibilidad obsoleta con websocket colibri.
- Notas completas: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146`,
    de_DE: `Aktualisiert Jitsi Meet auf stable-11146.

- Upstream führt alle Container jetzt als unprivilegierter Benutzer statt als root aus, und XMPP-Konten wechseln an einen eigenen Speicherort. Ihr Administratorkonto wird beim ersten Start automatisch übernommen.
- Ergänzt Live-Audioübersetzung und virtuellen Hintergrund v2; entfernt die veraltete Colibri-WebSocket-Unterstützung.
- Vollständige Versionshinweise: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146`,
    pl_PL: `Aktualizuje Jitsi Meet do stable-11146.

- Upstream uruchamia teraz wszystkie kontenery jako użytkownik bez uprawnień zamiast roota, a konta XMPP przenoszą się do własnej lokalizacji. Twoje konto administratora zostanie automatycznie przeniesione przy pierwszym uruchomieniu.
- Dodaje tłumaczenie dźwięku na żywo i wirtualne tło v2; usuwa przestarzałą obsługę websocket colibri.
- Pełne informacje o wydaniu: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146`,
    fr_FR: `Met à jour Jitsi Meet vers stable-11146.

- En amont, tous les conteneurs s'exécutent désormais en tant qu'utilisateur non privilégié plutôt que root et les comptes XMPP sont déplacés vers leur propre emplacement de stockage. Votre compte administrateur est conservé automatiquement au premier démarrage.
- Ajoute la traduction audio en direct et l'arrière-plan virtuel v2 ; supprime la prise en charge obsolète du websocket colibri.
- Notes de version complètes : https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
