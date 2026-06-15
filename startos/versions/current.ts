import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11031:2',
  releaseNotes: {
    en_US: `Updated Coturn to 4.13.1, a security release for the TURN server.

- Canonicalizes IPv4-in-IPv6 addresses before peer-IP checks.
- Denies Coturn's own database backend endpoints as relay peers.
- Denies link-local / ULA / site-local relay peers by default.

Full changelog: https://github.com/coturn/coturn/compare/4.13.0...4.13.1`,
    es_ES: `Actualiza Coturn a 4.13.1, una versión de seguridad para el servidor TURN.

- Canoniza las direcciones IPv4 en IPv6 antes de las comprobaciones de IP de pares.
- Rechaza los puntos finales de la base de datos del propio Coturn como pares de retransmisión.
- Rechaza por defecto los pares de retransmisión de enlace local, ULA y sitio local.

Registro de cambios completo: https://github.com/coturn/coturn/compare/4.13.0...4.13.1`,
    de_DE: `Aktualisiert Coturn auf 4.13.1, eine Sicherheitsversion für den TURN-Server.

- Kanonisiert IPv4-in-IPv6-Adressen vor den Peer-IP-Prüfungen.
- Verweigert Coturns eigene Datenbank-Backend-Endpunkte als Relay-Peers.
- Verweigert standardmäßig Link-Local-, ULA- und Site-Local-Relay-Peers.

Vollständiges Änderungsprotokoll: https://github.com/coturn/coturn/compare/4.13.0...4.13.1`,
    pl_PL: `Aktualizuje Coturn do 4.13.1, wydania zabezpieczeń dla serwera TURN.

- Kanonizuje adresy IPv4-w-IPv6 przed kontrolą adresów IP węzłów.
- Odrzuca własne punkty końcowe bazy danych Coturn jako węzły przekazujące.
- Domyślnie odrzuca węzły przekazujące link-local, ULA i site-local.

Pełny dziennik zmian: https://github.com/coturn/coturn/compare/4.13.0...4.13.1`,
    fr_FR: `Met à jour Coturn vers 4.13.1, une version de sécurité pour le serveur TURN.

- Canonise les adresses IPv4 dans IPv6 avant les vérifications d'IP des pairs.
- Refuse les propres points de terminaison de base de données de Coturn comme pairs de relais.
- Refuse par défaut les pairs de relais link-local, ULA et site-local.

Journal des modifications complet : https://github.com/coturn/coturn/compare/4.13.0...4.13.1`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
