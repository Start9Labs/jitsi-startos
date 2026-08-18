import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11146:2',
  releaseNotes: {
    en_US: `Updated the Jitsi Meet container images to stable-11146-2.

- Jitsi Meet itself stays at 2.0.11146; this upstream release moves where prosody stores XMPP accounts. Existing accounts, including your admin login, are moved to the new location automatically on first start.
- Full upstream release notes: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146-2`,
    es_ES: `Actualiza las imágenes de contenedor de Jitsi Meet a stable-11146-2.

- Jitsi Meet sigue en 2.0.11146; esta versión de origen cambia el lugar donde prosody guarda las cuentas XMPP. Las cuentas existentes, incluido tu acceso de administrador, se trasladan automáticamente a la nueva ubicación en el primer arranque.
- Notas completas: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146-2`,
    de_DE: `Aktualisiert die Jitsi-Meet-Container-Images auf stable-11146-2.

- Jitsi Meet selbst bleibt bei 2.0.11146; diese Upstream-Version ändert den Speicherort der XMPP-Konten von prosody. Vorhandene Konten, einschließlich Ihres Administratorzugangs, werden beim ersten Start automatisch an den neuen Ort verschoben.
- Vollständige Versionshinweise: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146-2`,
    pl_PL: `Aktualizuje obrazy kontenerów Jitsi Meet do stable-11146-2.

- Samo Jitsi Meet pozostaje w wersji 2.0.11146; to wydanie zmienia miejsce przechowywania kont XMPP przez prosody. Istniejące konta, w tym Twój login administratora, zostaną automatycznie przeniesione w nowe miejsce przy pierwszym uruchomieniu.
- Pełne informacje o wydaniu: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146-2`,
    fr_FR: `Met à jour les images de conteneur Jitsi Meet vers stable-11146-2.

- Jitsi Meet reste en 2.0.11146 ; cette version amont modifie l'emplacement où prosody stocke les comptes XMPP. Les comptes existants, y compris votre identifiant administrateur, sont déplacés automatiquement vers le nouvel emplacement au premier démarrage.
- Notes de version complètes : https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146-2`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
