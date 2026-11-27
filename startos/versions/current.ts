import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2.0.11509.1:4',
  releaseNotes: {
    en_US:
      'New: record meetings, or stream them live to an RTMP address such as Owncast, through the Jibri service on this server or another. Turn it on in the new Recording action; it is off by default.',
    es_ES:
      'Nuevo: graba reuniones, o transmítelas en directo a una dirección RTMP como Owncast, mediante el servicio Jibri en este servidor o en otro. Actívalo en la nueva acción Grabación; está desactivado por defecto.',
    de_DE:
      'Neu: Besprechungen über den Dienst Jibri auf diesem oder einem anderen Server aufzeichnen oder live an eine RTMP-Adresse wie Owncast streamen. Aktivieren Sie es in der neuen Aktion Aufzeichnung; standardmäßig ist es aus.',
    pl_PL:
      'Nowość: nagrywaj spotkania lub transmituj je na żywo na adres RTMP, np. Owncast, przez usługę Jibri na tym lub innym serwerze. Włącz to w nowej akcji Nagrywanie; domyślnie jest wyłączone.',
    fr_FR:
      'Nouveau : enregistrez les réunions, ou diffusez-les en direct vers une adresse RTMP comme Owncast, via le service Jibri sur ce serveur ou un autre. Activez-le dans la nouvelle action Enregistrement ; il est désactivé par défaut.',
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
