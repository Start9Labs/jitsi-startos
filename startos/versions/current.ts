import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11031:6',
  releaseNotes: {
    en_US: `TURN/STUN relay is now provided by the separate Coturn package instead of a bundled server.

- Jitsi now depends on the Coturn package. Install it and give it a public domain to enable TURN for participants behind restrictive NAT or firewalls — Jitsi picks up its address and shared secret automatically.
- No change to meetings, the web UI, or admin accounts.`,
    es_ES: `La retransmisión TURN/STUN ahora la proporciona el paquete Coturn independiente en lugar de un servidor integrado.

- Jitsi ahora depende del paquete Coturn. Instálalo y asígnale un dominio público para habilitar TURN para participantes detrás de NAT o cortafuegos restrictivos: Jitsi obtiene su dirección y secreto compartido automáticamente.
- Sin cambios en las reuniones, la interfaz web ni las cuentas de administrador.`,
    de_DE: `Das TURN/STUN-Relay wird jetzt vom separaten Coturn-Paket bereitgestellt statt von einem gebündelten Server.

- Jitsi hängt jetzt vom Coturn-Paket ab. Installieren Sie es und geben Sie ihm eine öffentliche Domain, um TURN für Teilnehmer hinter restriktiven NATs oder Firewalls zu aktivieren — Jitsi übernimmt Adresse und gemeinsames Geheimnis automatisch.
- Keine Änderung an Meetings, der Weboberfläche oder Administratorkonten.`,
    pl_PL: `Przekaźnik TURN/STUN jest teraz dostarczany przez osobny pakiet Coturn zamiast wbudowanego serwera.

- Jitsi zależy teraz od pakietu Coturn. Zainstaluj go i nadaj mu domenę publiczną, aby włączyć TURN dla uczestników za restrykcyjnymi NAT lub zaporami — Jitsi automatycznie pobiera jego adres i wspólny sekret.
- Bez zmian w spotkaniach, interfejsie webowym ani kontach administratora.`,
    fr_FR: `Le relais TURN/STUN est désormais fourni par le paquet Coturn séparé au lieu d'un serveur intégré.

- Jitsi dépend maintenant du paquet Coturn. Installez-le et donnez-lui un domaine public pour activer TURN pour les participants derrière des NAT ou pare-feux restrictifs — Jitsi récupère automatiquement son adresse et son secret partagé.
- Aucun changement pour les réunions, l'interface web ou les comptes administrateur.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
