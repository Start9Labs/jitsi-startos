import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11146:1',
  releaseNotes: {
    en_US: `Updated the Jitsi Meet container images to stable-11146-1.

- A maintenance rebuild: Jitsi Meet itself stays at 2.0.11146, and the fixes in this upstream release apply to components this package does not ship. The rebuilt images pick up current base-system packages.
- Full upstream release notes: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146-1`,
    es_ES: `Actualiza las imágenes de contenedor de Jitsi Meet a stable-11146-1.

- Es una reconstrucción de mantenimiento: Jitsi Meet sigue en 2.0.11146 y las correcciones de esta versión afectan a componentes que este paquete no incluye. Las imágenes reconstruidas incorporan los paquetes actuales del sistema base.
- Notas completas: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146-1`,
    de_DE: `Aktualisiert die Jitsi-Meet-Container-Images auf stable-11146-1.

- Ein Wartungs-Rebuild: Jitsi Meet selbst bleibt bei 2.0.11146, und die Korrekturen dieser Version betreffen Komponenten, die dieses Paket nicht ausliefert. Die neu gebauten Images übernehmen aktuelle Basissystem-Pakete.
- Vollständige Versionshinweise: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146-1`,
    pl_PL: `Aktualizuje obrazy kontenerów Jitsi Meet do stable-11146-1.

- To przebudowa konserwacyjna: samo Jitsi Meet pozostaje w wersji 2.0.11146, a poprawki z tego wydania dotyczą komponentów, których ten pakiet nie zawiera. Przebudowane obrazy zawierają aktualne pakiety systemu bazowego.
- Pełne informacje o wydaniu: https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146-1`,
    fr_FR: `Met à jour les images de conteneur Jitsi Meet vers stable-11146-1.

- Il s'agit d'une reconstruction de maintenance : Jitsi Meet reste en 2.0.11146 et les correctifs de cette version amont concernent des composants que ce paquet ne fournit pas. Les images reconstruites intègrent les paquets actuels du système de base.
- Notes de version complètes : https://github.com/jitsi/docker-jitsi-meet/releases/tag/stable-11146-1`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
