import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11509:1',
  releaseNotes: {
    en_US: `Security: disable JVM Base64 intrinsics in both Jicofo and JVB to mitigate CVE-2026-114938 (Java4Shell) on affected AVX-512 x86 processors. ARM is not affected by this CVE. No service-specific exploit has been established.

Updated Jitsi Meet to stable-11509.

**Features**
- Moderators can close polls, and polls can be limited to a single answer
- Moderators can restrict breakout rooms to the participants they assign, and video sharing to participants with permission
- Participants are notified when their media connection has problems
- A new Experimental settings tab with a Picture-in-Picture switch, and the app remembers the language and settings chosen in the browser

**Fixes**
- Numerous fixes to chat, tracks and the participants pane

[Full release notes](https://github.com/jitsi/jitsi-meet-release-notes/blob/master/CHANGELOG-WEB.md)`,
    es_ES: `Seguridad: se desactivan los intrínsecos Base64 de la JVM en Jicofo y JVB para mitigar CVE-2026-114938 (Java4Shell) en procesadores x86 con AVX-512 afectados. ARM no está afectado por este CVE. No se ha demostrado un exploit específico del servicio.

Jitsi Meet actualizado a stable-11509.

**Novedades**
- Los moderadores pueden cerrar encuestas, y las encuestas pueden limitarse a una sola respuesta
- Los moderadores pueden restringir las salas de grupos a los participantes que asignen, y el uso compartido de vídeo a los participantes con permiso
- Los participantes reciben un aviso cuando su conexión multimedia tiene problemas
- Nueva pestaña de ajustes experimentales con un interruptor de imagen en imagen, y la aplicación recuerda el idioma y los ajustes elegidos en el navegador

**Correcciones**
- Numerosas correcciones en el chat, las pistas y el panel de participantes

[Notas de la versión completas](https://github.com/jitsi/jitsi-meet-release-notes/blob/master/CHANGELOG-WEB.md)`,
    de_DE: `Sicherheit: JVM-Base64-Intrinsics in Jicofo und JVB deaktiviert, um CVE-2026-114938 (Java4Shell) auf betroffenen x86-Prozessoren mit AVX-512 zu entschärfen. ARM ist von diesem CVE nicht betroffen. Ein dienstspezifischer Exploit wurde nicht nachgewiesen.

Jitsi Meet auf stable-11509 aktualisiert.

**Neuerungen**
- Moderatoren können Umfragen schließen, und Umfragen lassen sich auf eine einzige Antwort beschränken
- Moderatoren können Breakout-Räume auf die von ihnen zugewiesenen Teilnehmer und das Teilen von Videos auf berechtigte Teilnehmer beschränken
- Teilnehmer werden benachrichtigt, wenn ihre Medienverbindung Probleme hat
- Ein neuer Einstellungs-Tab „Experimentell“ mit einem Bild-im-Bild-Schalter, und die App merkt sich die im Browser gewählte Sprache und Einstellungen

**Fehlerbehebungen**
- Zahlreiche Korrekturen an Chat, Medienspuren und Teilnehmerbereich

[Vollständige Versionshinweise](https://github.com/jitsi/jitsi-meet-release-notes/blob/master/CHANGELOG-WEB.md)`,
    pl_PL: `Bezpieczeństwo: wyłączono intrinsics Base64 JVM w Jicofo i JVB, aby ograniczyć CVE-2026-114938 (Java4Shell) na podatnych procesorach x86 z AVX-512. ARM nie jest objęty tym CVE. Nie wykazano exploita specyficznego dla tej usługi.

Zaktualizowano Jitsi Meet do stable-11509.

**Nowości**
- Moderatorzy mogą zamykać ankiety, a ankiety można ograniczyć do jednej odpowiedzi
- Moderatorzy mogą ograniczyć pokoje podgrup do przydzielonych przez siebie uczestników, a udostępnianie wideo do uczestników z uprawnieniem
- Uczestnicy są powiadamiani o problemach z połączeniem multimedialnym
- Nowa karta ustawień eksperymentalnych z przełącznikiem obrazu w obrazie, a aplikacja zapamiętuje język i ustawienia wybrane w przeglądarce

**Poprawki**
- Liczne poprawki czatu, ścieżek multimedialnych i panelu uczestników

[Pełne informacje o wydaniu](https://github.com/jitsi/jitsi-meet-release-notes/blob/master/CHANGELOG-WEB.md)`,
    fr_FR: `Sécurité : désactivation des intrinsèques Base64 de la JVM dans Jicofo et JVB pour atténuer CVE-2026-114938 (Java4Shell) sur les processeurs x86 AVX-512 concernés. ARM n’est pas affecté par ce CVE. Aucun exploit propre au service n’a été établi.

Mise à jour de Jitsi Meet vers stable-11509.

**Nouveautés**
- Les modérateurs peuvent clôturer les sondages, et les sondages peuvent être limités à une seule réponse
- Les modérateurs peuvent réserver les salles de sous-groupes aux participants qu’ils y affectent, et le partage de vidéo aux participants autorisés
- Les participants sont avertis lorsque leur connexion média rencontre des problèmes
- Un nouvel onglet de paramètres expérimentaux avec un interrupteur d’image dans l’image, et l’application mémorise la langue et les paramètres choisis dans le navigateur

**Corrections**
- Nombreuses corrections du chat, des pistes et du panneau des participants

[Notes de version complètes](https://github.com/jitsi/jitsi-meet-release-notes/blob/master/CHANGELOG-WEB.md)`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
