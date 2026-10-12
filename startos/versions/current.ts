import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11248:3',
  releaseNotes: {
    en_US:
      'Restarting Jitsi Meet while it is still starting stops every process of the previous run.',
    es_ES:
      'Reiniciar Jitsi Meet mientras aún se está iniciando detiene todos los procesos de la ejecución anterior.',
    de_DE:
      'Ein Neustart von Jitsi Meet, während es noch startet, beendet alle Prozesse des vorherigen Laufs.',
    pl_PL:
      'Ponowne uruchomienie Jitsi Meet w trakcie uruchamiania zatrzymuje wszystkie procesy poprzedniego uruchomienia.',
    fr_FR:
      "Redémarrer Jitsi Meet pendant son démarrage arrête tous les processus de l'exécution précédente.",
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
