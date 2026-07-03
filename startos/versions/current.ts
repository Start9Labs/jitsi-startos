import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11031:3',
  releaseNotes: {
    en_US: `Updated Coturn to 4.14.0 for the TURN server.

- Rewritten, vendored Prometheus metrics exporter (no longer depends on prometheus-client-c), with optional HTTPS.
- Optional TLS transport for Redis connections (compatible with managed Redis).
- Experimental per-source rate limiting of "401 Unauthorized" responses to reduce reflection attacks (off by default).
- Fixes a signed-char out-of-bounds read in base64 decoding and a realm-quota data race.
- Internal updates (start-sdk 2.0.x)

Full changelog: https://github.com/coturn/coturn/compare/4.13.1...4.14.0`,
    es_ES: `Actualiza Coturn a 4.14.0 para el servidor TURN.

- Exportador de métricas de Prometheus reescrito e integrado (ya no depende de prometheus-client-c), con HTTPS opcional.
- Transporte TLS opcional para las conexiones a Redis (compatible con Redis gestionado).
- Limitación de tasa experimental por origen de las respuestas "401 Unauthorized" para reducir los ataques de reflexión (desactivada por defecto).
- Corrige una lectura fuera de límites con char con signo en la decodificación base64 y una condición de carrera en la cuota de realm.
- Actualizaciones internas (start-sdk 2.0.x)

Registro de cambios completo: https://github.com/coturn/coturn/compare/4.13.1...4.14.0`,
    de_DE: `Aktualisiert Coturn auf 4.14.0 für den TURN-Server.

- Neu geschriebener, integrierter Prometheus-Metrik-Exporter (nicht mehr von prometheus-client-c abhängig), mit optionalem HTTPS.
- Optionaler TLS-Transport für Redis-Verbindungen (kompatibel mit verwaltetem Redis).
- Experimentelle quellenbasierte Ratenbegrenzung von „401 Unauthorized"-Antworten zur Reduzierung von Reflexionsangriffen (standardmäßig deaktiviert).
- Behebt einen Out-of-Bounds-Lesezugriff mit vorzeichenbehaftetem char bei der Base64-Dekodierung und eine Realm-Quota-Race-Condition.
- Interne Aktualisierungen (start-sdk 2.0.x)

Vollständiges Änderungsprotokoll: https://github.com/coturn/coturn/compare/4.13.1...4.14.0`,
    pl_PL: `Aktualizuje Coturn do 4.14.0 dla serwera TURN.

- Przepisany, wbudowany eksporter metryk Prometheus (nie zależy już od prometheus-client-c), z opcjonalnym HTTPS.
- Opcjonalny transport TLS dla połączeń Redis (zgodny z zarządzanym Redisem).
- Eksperymentalne ograniczanie liczby odpowiedzi „401 Unauthorized" na źródło w celu ograniczenia ataków typu reflection (domyślnie wyłączone).
- Naprawia odczyt poza zakresem dla char ze znakiem w dekodowaniu base64 oraz wyścig danych w limicie realm.
- Aktualizacje wewnętrzne (start-sdk 2.0.x)

Pełny dziennik zmian: https://github.com/coturn/coturn/compare/4.13.1...4.14.0`,
    fr_FR: `Met à jour Coturn vers 4.14.0 pour le serveur TURN.

- Exportateur de métriques Prometheus réécrit et intégré (ne dépend plus de prometheus-client-c), avec HTTPS facultatif.
- Transport TLS facultatif pour les connexions Redis (compatible avec Redis géré).
- Limitation de débit expérimentale par source des réponses « 401 Unauthorized » pour réduire les attaques par réflexion (désactivée par défaut).
- Corrige une lecture hors limites avec char signé dans le décodage base64 et une situation de concurrence sur le quota de realm.
- Mises à jour internes (start-sdk 2.0.x)

Journal des modifications complet : https://github.com/coturn/coturn/compare/4.13.1...4.14.0`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
