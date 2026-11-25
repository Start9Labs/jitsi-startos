import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11509.1:2',
  releaseNotes: {
    en_US:
      'New: a Prosody Modules action loads additional Prosody modules, including your own from a new custom modules folder.',
    es_ES:
      'Nuevo: una acción «Módulos de Prosody» carga módulos adicionales de Prosody, incluidos los tuyos desde una nueva carpeta de módulos personalizados.',
    de_DE:
      'Neu: Die Aktion „Prosody-Module“ lädt zusätzliche Prosody-Module, auch eigene aus einem neuen Ordner für benutzerdefinierte Module.',
    pl_PL:
      'Nowość: akcja „Moduły Prosody” ładuje dodatkowe moduły Prosody, w tym własne z nowego folderu modułów niestandardowych.',
    fr_FR:
      'Nouveau : une action « Modules Prosody » charge des modules Prosody supplémentaires, y compris les vôtres depuis un nouveau dossier de modules personnalisés.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
