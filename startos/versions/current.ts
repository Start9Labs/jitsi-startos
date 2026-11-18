import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11509:1',
  releaseNotes: {
    en_US:
      'Security: mitigates CVE-2026-114938 (Java4Shell) on affected x86-64 processors with AVX-512 VBMI. ARM64 servers are not affected. Details: https://calif.io/java4shell/',
    es_ES:
      'Seguridad: mitiga CVE-2026-114938 (Java4Shell) en procesadores x86-64 afectados con AVX-512 VBMI. Los servidores ARM64 no están afectados. Detalles: https://calif.io/java4shell/',
    de_DE:
      'Sicherheit: entschärft CVE-2026-114938 (Java4Shell) auf betroffenen x86-64-Prozessoren mit AVX-512 VBMI. ARM64-Server sind nicht betroffen. Details: https://calif.io/java4shell/',
    pl_PL:
      'Bezpieczeństwo: ogranicza podatność CVE-2026-114938 (Java4Shell) na podatnych procesorach x86-64 z AVX-512 VBMI. Serwery ARM64 nie są podatne. Szczegóły: https://calif.io/java4shell/',
    fr_FR:
      'Sécurité : atténue CVE-2026-114938 (Java4Shell) sur les processeurs x86-64 concernés dotés d’AVX-512 VBMI. Les serveurs ARM64 ne sont pas concernés. Détails : https://calif.io/java4shell/',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
