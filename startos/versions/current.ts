import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11509.1:3',
  releaseNotes: {
    en_US:
      "New: server-side recording through a Jibri you run on another machine. A Recording action (off by default) lets it connect; Recorder Connection Details shows its settings and the certificate to pin; Rotate Recorder Passwords replaces its passwords. While Recording is off the recorder's accounts do not exist.",
    es_ES:
      'Nuevo: grabación en el servidor mediante un Jibri que ejecutas en otro equipo. La acción «Grabación» (desactivada por defecto) le permite conectarse; «Detalles de conexión del grabador» muestra sus ajustes y el certificado que debe fijar; «Rotar contraseñas del grabador» sustituye sus contraseñas. Mientras la grabación está desactivada, las cuentas del grabador no existen.',
    de_DE:
      'Neu: serverseitige Aufnahme über ein Jibri, das Sie auf einem anderen Rechner betreiben. Die Aktion „Aufnahme“ (standardmäßig aus) lässt es sich verbinden; „Verbindungsdaten des Recorders“ zeigt seine Einstellungen und das zu pinnende Zertifikat; „Recorder-Passwörter erneuern“ ersetzt seine Passwörter. Solange die Aufnahme aus ist, existieren die Konten des Recorders nicht.',
    pl_PL:
      'Nowość: nagrywanie po stronie serwera przez Jibri uruchomione na innym komputerze. Akcja „Nagrywanie” (domyślnie wyłączona) pozwala mu się połączyć; „Dane połączenia rejestratora” pokazują jego ustawienia i certyfikat do przypięcia; „Zmień hasła rejestratora” zastępuje jego hasła. Gdy nagrywanie jest wyłączone, konta rejestratora nie istnieją.',
    fr_FR:
      'Nouveau : l’enregistrement côté serveur via un Jibri que vous exécutez sur une autre machine. L’action « Enregistrement » (désactivée par défaut) lui permet de se connecter ; « Détails de connexion de l’enregistreur » affiche ses réglages et le certificat à épingler ; « Renouveler les mots de passe de l’enregistreur » remplace ses mots de passe. Tant que l’enregistrement est désactivé, les comptes de l’enregistreur n’existent pas.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
