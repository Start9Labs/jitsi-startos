import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11031:1',
  releaseNotes: {
    en_US: `Updated Coturn to 4.13.0.

- Security hardening: port parsing, admin brute-force throttling, credential log redaction, constant-time comparison, OAuth bounds checks.
- Further UDP relay performance gains; \`--udp-recvmmsg\` now enabled by default on Linux.

Full changelog: https://github.com/coturn/coturn/compare/4.12.0...4.13.0`,
    es_ES: `Actualiza Coturn a 4.13.0.

- Refuerzo de seguridad: análisis de puertos, limitación de fuerza bruta en administración, ocultación de credenciales en registros, comparación en tiempo constante, comprobaciones de límites de OAuth.
- Más mejoras de rendimiento en la retransmisión UDP; \`--udp-recvmmsg\` ahora activado por defecto en Linux.

Registro de cambios completo: https://github.com/coturn/coturn/compare/4.12.0...4.13.0`,
    de_DE: `Aktualisiert Coturn auf 4.13.0.

- Sicherheitshärtung: Port-Parsing, Admin-Brute-Force-Drosselung, Schwärzung von Anmeldedaten in Logs, konstantzeitiger Vergleich, OAuth-Grenzwertprüfungen.
- Weitere UDP-Relay-Leistungssteigerungen; \`--udp-recvmmsg\` ist unter Linux jetzt standardmäßig aktiviert.

Vollständiges Änderungsprotokoll: https://github.com/coturn/coturn/compare/4.12.0...4.13.0`,
    pl_PL: `Aktualizuje Coturn do 4.13.0.

- Wzmocnienie bezpieczeństwa: parsowanie portów, ograniczanie ataków siłowych na konto administratora, ukrywanie danych uwierzytelniających w logach, porównanie w stałym czasie, kontrola zakresów OAuth.
- Dalsze zwiększenie wydajności przekazywania UDP; \`--udp-recvmmsg\` jest teraz domyślnie włączone w systemie Linux.

Pełny dziennik zmian: https://github.com/coturn/coturn/compare/4.12.0...4.13.0`,
    fr_FR: `Met à jour Coturn vers 4.13.0.

- Renforcement de la sécurité : analyse des ports, limitation des attaques par force brute sur l'administration, masquage des identifiants dans les journaux, comparaison à temps constant, vérifications des limites OAuth.
- Nouveaux gains de performance du relais UDP ; \`--udp-recvmmsg\` est désormais activé par défaut sous Linux.

Journal des modifications complet : https://github.com/coturn/coturn/compare/4.12.0...4.13.0`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
