# Updating the upstream version

Jitsi Meet ships as four coordinated upstream images, all pinned by `dockerTag` in `startos/manifest/index.ts`. (The TURN server is no longer bundled — it lives in the separate [`coturn-startos`](https://github.com/Start9Labs/coturn-startos) package, which Jitsi depends on and which is versioned there.)

## Determining the upstream version

- **Jitsi** — the four coordinated images (`jitsi/web`, `jitsi/prosody`, `jitsi/jicofo`, `jitsi/jvb`) are built and tagged together by [`jitsi/docker-jitsi-meet`](https://github.com/jitsi/docker-jitsi-meet). Each release is a `stable-<build>` tag (e.g. `stable-11031`) that all four images share. The current pin lives in `startos/manifest/index.ts` on the `web`, `prosody`, `jicofo`, and `jvb` image entries.

  ```bash
  gh release view -R jitsi/docker-jitsi-meet --json tagName -q .tagName
  # or, to see recent builds:
  gh release list -R jitsi/docker-jitsi-meet
  ```

## Applying the bump

Find the latest `stable-<build>` tag published by [docker-jitsi-meet](https://github.com/jitsi/docker-jitsi-meet) (e.g. `stable-11031`). All four Jitsi images share that build number and must be bumped together:

- `jitsi/web:stable-<build>`
- `jitsi/prosody:stable-<build>`
- `jitsi/jicofo:stable-<build>`
- `jitsi/jvb:stable-<build>`

If the Coturn dependency's minimum version needs to change, update `coturnVersionRange` in `startos/utils.ts`.
