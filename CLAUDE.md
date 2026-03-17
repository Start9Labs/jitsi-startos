## How the upstream version is pulled
- dockerTags in `startos/manifest/index.ts` — all must be updated together:
  - `jitsi/web:stable-<build>`
  - `jitsi/prosody:stable-<build>`
  - `jitsi/jicofo:stable-<build>`
  - `jitsi/jvb:stable-<build>`
- Sidecar `coturn` image has its own version.
