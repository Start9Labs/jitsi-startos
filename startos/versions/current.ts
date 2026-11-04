import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11248.3:1',
  releaseNotes: {
    en_US:
      'Jitsi Meet now includes its own TURN relay and no longer needs the Coturn package. To let participants on restrictive networks join, add a public domain to the new TURN Relay interface.',
    es_ES:
      'Jitsi Meet ahora incluye su propio relé TURN y ya no necesita el paquete Coturn. Para que puedan unirse participantes en redes restrictivas, agrega un dominio público a la nueva interfaz TURN Relay.',
    de_DE:
      'Jitsi Meet enthält jetzt ein eigenes TURN-Relay und benötigt das Coturn-Paket nicht mehr. Damit Teilnehmer in restriktiven Netzwerken beitreten können, fügen Sie der neuen Schnittstelle TURN Relay eine öffentliche Domain hinzu.',
    pl_PL:
      'Jitsi Meet ma teraz własny przekaźnik TURN i nie potrzebuje już pakietu Coturn. Aby uczestnicy w restrykcyjnych sieciach mogli dołączyć, dodaj domenę publiczną do nowego interfejsu TURN Relay.',
    fr_FR:
      'Jitsi Meet inclut désormais son propre relais TURN et n’a plus besoin du paquet Coturn. Pour que les participants sur des réseaux restrictifs puissent rejoindre, ajoutez un domaine public à la nouvelle interface TURN Relay.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
