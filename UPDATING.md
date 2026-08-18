# Updating the upstream version

Jitsi Meet ships as four coordinated upstream images, all pinned by `dockerTag` in `startos/manifest/index.ts`. (The TURN server is no longer bundled — it lives in the separate [`coturn-startos`](https://github.com/Start9Labs/coturn-startos) package, which Jitsi depends on and which is versioned there.)

## Determining the upstream version

- **Jitsi** — the four coordinated images (`ghcr.io/jitsi/web`, `ghcr.io/jitsi/prosody`, `ghcr.io/jitsi/jicofo`, `ghcr.io/jitsi/jvb`) are built and tagged together by [`jitsi/docker-jitsi-meet`](https://github.com/jitsi/docker-jitsi-meet). Each release is a `stable-<build>` tag (e.g. `stable-11146`) that all four images share. The current pin lives in `startos/manifest/index.ts` on the `web`, `prosody`, `jicofo`, and `jvb` image entries.

  ```bash
  gh release view -R jitsi/docker-jitsi-meet --json tagName -q .tagName
  # or, to see recent builds:
  gh release list -R jitsi/docker-jitsi-meet
  ```

  Upstream publishes to **GHCR**. It moved there during `stable-11146`; Docker Hub (`docker.io/jitsi/*`) stopped receiving `stable-*` tags at `stable-11031`, so pin `ghcr.io/jitsi/*`. GHCR's paginated tag list does not surface `stable-*` tags, so confirm a tag by fetching its manifest directly rather than listing:

  ```bash
  TOKEN=$(curl -s "https://ghcr.io/token?scope=repository:jitsi/web:pull&service=ghcr.io" | jq -r .token)
  curl -s -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.oci.image.index.v1+json" \
    "https://ghcr.io/v2/jitsi/web/manifests/stable-<build>" | jq '.manifests[].platform'
  ```

  Repeat for all four images — a release is only usable if every one of them resolves for both `amd64` and `arm64`.

## Applying the bump

Find the latest `stable-<build>` tag published by [docker-jitsi-meet](https://github.com/jitsi/docker-jitsi-meet) (e.g. `stable-11146`). All four Jitsi images share that build number and must be bumped together:

- `ghcr.io/jitsi/web:stable-<build>`
- `ghcr.io/jitsi/prosody:stable-<build>`
- `ghcr.io/jitsi/jicofo:stable-<build>`
- `ghcr.io/jitsi/jvb:stable-<build>`

Read the upstream release notes for changes to the container contract, not just to Jitsi itself — the images run unprivileged (uid 1000) and each treats `/config` as a read-only seed. A release that adds a directory the containers must write to needs a matching mount plus a `chown` oneshot in `startos/main.ts`, and a port change in `web/rootfs/defaults/default` needs `uiPort` in `startos/utils.ts` updated to match.

Sort each of those into the right mechanism. **Ownership is a oneshot** — StartOS mounts volumes root-owned on every start, so `chown` has to run every time. **A relocation of existing data is `migrations.up` in `startos/versions/current.ts`** — it runs once, off the stored data version, so it also covers a restore from an older backup and never touches a fresh install. `stable-11146-2` moving `data_path` to `/var/lib/prosody/data` was the second kind. Adding a migration means the _next_ bump spins this version off into `startos/versions/v2.0.11146_2.ts` and lists it in `other`, rather than editing `current.ts` in place.

If a release changes which uid the containers run as, check the **upgrade** path, not just a fresh install: files an earlier release wrote are left owned by the old uid, and the entrypoints copy seed data with plain `cp` that fails silently on a permission error. Compare a populated volume against the new uid before shipping — `2.0.11146:0` hit exactly this, and the seed it left unreadable is repaired by the `2.0.11146:2` migration.

If the Coturn dependency's minimum version needs to change, update `coturnVersionRange` in `startos/utils.ts`.
