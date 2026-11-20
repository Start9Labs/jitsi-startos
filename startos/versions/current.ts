import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11509.1:1',
  releaseNotes: {
    en_US:
      'Security: updates the bundled Coturn relay to 4.19.2, which fixes a possible relay crash when answering a UDP authentication challenge. Full notes: https://github.com/coturn/coturn/blob/4.19.2/ChangeLog',
    es_ES:
      'Seguridad: actualiza el relé Coturn incluido a 4.19.2, que corrige un posible fallo del relé al responder a un desafío de autenticación UDP. Notas completas: https://github.com/coturn/coturn/blob/4.19.2/ChangeLog',
    de_DE:
      'Sicherheit: Aktualisiert das mitgelieferte Coturn-Relay auf 4.19.2, das einen möglichen Absturz des Relays bei der Beantwortung einer UDP-Authentifizierungsanfrage behebt. Vollständige Versionshinweise: https://github.com/coturn/coturn/blob/4.19.2/ChangeLog',
    pl_PL:
      'Bezpieczeństwo: aktualizuje dołączony przekaźnik Coturn do wersji 4.19.2, która usuwa możliwą awarię przekaźnika podczas odpowiadania na wyzwanie uwierzytelniania UDP. Pełne informacje o wydaniu: https://github.com/coturn/coturn/blob/4.19.2/ChangeLog',
    fr_FR:
      'Sécurité : met à jour le relais Coturn intégré vers la version 4.19.2, qui corrige un plantage possible du relais lors de la réponse à un défi d’authentification UDP. Notes de version complètes : https://github.com/coturn/coturn/blob/4.19.2/ChangeLog',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
