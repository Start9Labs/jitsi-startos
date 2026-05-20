# Updating the upstream version

Jitsi Meet ships as four coordinated upstream images plus a sidecar TURN server. They're all pinned by `dockerTag` in `startos/manifest/index.ts`.

## Determining the upstream version

Two independent upstream sources drive this package:

- **Jitsi** — the four coordinated images (`jitsi/web`, `jitsi/prosody`, `jitsi/jicofo`, `jitsi/jvb`) are built and tagged together by [`jitsi/docker-jitsi-meet`](https://github.com/jitsi/docker-jitsi-meet). Each release is a `stable-<build>` tag (e.g. `stable-10888`) that all four images share. The current pin lives in `startos/manifest/index.ts` on the `web`, `prosody`, `jicofo`, and `jvb` image entries.

  ```bash
  gh release view -R jitsi/docker-jitsi-meet --json tagName -q .tagName
  # or, to see recent builds:
  gh release list -R jitsi/docker-jitsi-meet
  ```

- **Coturn** — the TURN sidecar is pinned independently to `coturn/coturn:<version>` from [`coturn/coturn`](https://github.com/coturn/coturn). The current pin lives in `startos/manifest/index.ts` on the `coturn` image entry.

  ```bash
  gh release view -R coturn/coturn --json tagName -q .tagName
  ```

## Applying the bump

1. Find the latest `stable-<build>` tag published by [docker-jitsi-meet](https://github.com/jitsi/docker-jitsi-meet) (e.g. `stable-10888`). All four Jitsi images share that build number and must be bumped together:
   - `jitsi/web:stable-<build>`
   - `jitsi/prosody:stable-<build>`
   - `jitsi/jicofo:stable-<build>`
   - `jitsi/jvb:stable-<build>`
2. Bump the `coturn/coturn:<version>` tag independently when there's a new coturn release worth tracking.
