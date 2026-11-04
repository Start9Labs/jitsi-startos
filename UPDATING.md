# Updating the upstream version

Jitsi Meet ships as four coordinated upstream images plus Coturn's, all pinned by `dockerTag` in `startos/manifest/index.ts`. The Coturn image moves independently of Jitsi's; keep it on the tag [`coturn-startos`](https://github.com/Start9Labs/coturn-startos) pins.

## Determining the upstream version

- **Jitsi** — the four coordinated images (`ghcr.io/jitsi/web`, `ghcr.io/jitsi/prosody`, `ghcr.io/jitsi/jicofo`, `ghcr.io/jitsi/jvb`) are built and tagged together by [`jitsi/docker-jitsi-meet`](https://github.com/jitsi/docker-jitsi-meet). Each release is a `stable-<build>` or `stable-<build>-<patch>` tag that all four images share. The current pin lives in `startos/manifest/index.ts` on the `web`, `prosody`, `jicofo`, and `jvb` image entries.

  ```bash
  gh api --paginate 'repos/jitsi/docker-jitsi-meet/tags?per_page=100' \
    --jq '.[].name' | grep -E '^stable-[0-9]+(-[0-9]+)?$' | sort -V -r
  ```

  Upstream uses build numbers, not SemVer. Preserve a stable patch counter as an extra numeric component: `stable-<build>` maps to `2.0.<build>:0`, and `stable-<build>-<patch>` maps to `2.0.<build>.<patch>:0` (for example, `stable-11248-1` → `2.0.11248.1:0`). The suffix is a stable release, not an upstream prerelease or a StartOS wrapper revision. Keep the exact tag spelling in all four image pins.

  Pin `ghcr.io/jitsi/*`: Docker Hub (`docker.io/jitsi/*`) no longer receives `stable-*` tags. GHCR's paginated tag list does not surface `stable-*` tags, so confirm a tag by fetching its manifest directly rather than listing:

  ```bash
  TOKEN=$(curl -s "https://ghcr.io/token?scope=repository:jitsi/web:pull&service=ghcr.io" | jq -r .token)
  curl -s -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.oci.image.index.v1+json" \
    "https://ghcr.io/v2/jitsi/web/manifests/stable-<build>" | jq '.manifests[].platform'
  ```

  Repeat for all four images — a release is only usable if every one of them resolves for both `amd64` and `arm64`.

## Applying the bump

Find the latest stable tag published by [docker-jitsi-meet](https://github.com/jitsi/docker-jitsi-meet), including any numeric patch suffix (e.g. `stable-11248-1`). Use the complete tag in place of `stable-<build>` below. All four Jitsi images share that build number and must be bumped together:

- `ghcr.io/jitsi/web:stable-<build>`
- `ghcr.io/jitsi/prosody:stable-<build>`
- `ghcr.io/jitsi/jicofo:stable-<build>`
- `ghcr.io/jitsi/jvb:stable-<build>`

Read the upstream release notes for changes to the container contract, not just to Jitsi itself — the images run unprivileged (uid 1000) and each treats `/config` as a read-only seed. A release that adds a directory the containers must write to needs a matching mount plus a `chown` oneshot in `startos/main.ts`, and a port change in `web/rootfs/defaults/default` needs `uiPort` in `startos/utils.ts` updated to match.

If a release changes which uid the containers run as, files an earlier release wrote stay owned by the old uid, and the entrypoints copy seed data with plain `cp` that fails silently on a permission error.

A Coturn bump needs its own check: `renderTurnserverConf` in `startos/utils.ts` depends on how Coturn maps `external-ip` to `relay-ip` and orders `allowed-peer-ip` before `denied-peer-ip`, so read its changelog for either, and run a forced-relay call (`#config.forceTurnRelay=true`) before shipping.
