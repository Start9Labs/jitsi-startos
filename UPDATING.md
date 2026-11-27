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

The Prosody Modules action rests on two things in the prosody image, both in its `/defaults/conf.d/jitsi-meet.cfg.lua` template. Check each in the new tag:

- the template still reads `XMPP_MODULES`, `XMPP_MUC_MODULES` and `XMPP_SPEAKERSTATS_MODULES`, the three variables the action sets. A renamed variable is ignored without an error, so the listed modules stop loading.
- `/prosody-plugins-custom` is still the first entry in `plugin_paths`. If it moves or goes, files in the folder are no longer found, or no longer win over the image's own modules.

```bash
docker run --rm --entrypoint grep ghcr.io/jitsi/prosody:stable-<build> \
  -nE 'plugin_paths|XMPP_(MUC_|SPEAKERSTATS_)?MODULES' /defaults/conf.d/jitsi-meet.cfg.lua
```

The Recording action rests on what four images read. Check each in the new tag:

- prosody reads `ENABLE_RECORDING`, `JIBRI_XMPP_USER`, `JIBRI_XMPP_PASSWORD`, `JIBRI_RECORDER_USER` and `JIBRI_RECORDER_PASSWORD` in `/defaults/conf.d/jitsi-meet.cfg.lua` and `/etc/s6-overlay/scripts/register-setup`, and that script still creates an account only when it is missing. If it starts resetting passwords, the Rotate Recorder Passwords action no longer needs to re-register the accounts itself.
- the `recorder-setup` oneshot (`recorderSetupExec` in `startos/utils.ts`) rests on two things in the prosody image. Off, it deletes Jibri's accounts as files, because `prosodyctl deluser` here needs a running prosody: check that storage is still `internal`, under `/var/lib/prosody/data/<host with each non-alphanumeric character as %xx>/<store>/<user>.dat`, and whether `prosodyctl` can delete a user offline again (then use that). On, it keeps the `auth.meet.jitsi` certificate in `/config/certs`: check that `/etc/s6-overlay/scripts/config` still copies `/config` over `/run/prosody/config` before generating any certificate it finds missing there. Root only prepares that folder and hands the rest to `s6` through `/command/s6-setuidgid`, so check that s6-overlay still ships it there.
- **Canary for the off-state purge.** A store that moves fails silently: the purge finds no folder, deletes nothing, and the `jibri` admin account outlives Recording being turned off. Before shipping a tag, confirm prosody's `data_path`, then start the image once with recording on and confirm Jibri's two accounts land only where `prosodyHostDir` points (a SQL or other non-file store shows no files here, which fails the check too):

  ```bash
  IMG=ghcr.io/jitsi/prosody:stable-<build>
  docker run --rm --network none --entrypoint grep $IMG -n data_path /defaults/prosody.cfg.lua
  # expect: data_path = "/var/lib/prosody/data"
  docker run -d --name canary --network none -v canary:/var/lib/prosody \
    -e JICOFO_AUTH_PASSWORD=canary -e JVB_AUTH_PASSWORD=canary \
    -e ENABLE_RECORDING=1 -e JIBRI_XMPP_PASSWORD=canary -e JIBRI_RECORDER_PASSWORD=canary $IMG
  # once `docker logs canary` shows "All users registered":
  docker exec canary find /var/lib/prosody -name 'jibri.*' -o -name 'recorder.*'
  # expect only <host>/<store>/<user>.dat files under these two folders:
  #   /var/lib/prosody/data/auth%2emeet%2ejitsi/{accounts,account_roles}/jibri.dat
  #   /var/lib/prosody/data/hidden%2emeet%2ejitsi/{accounts,account_roles}/recorder.dat
  docker rm -f canary && docker volume rm canary
  ```

  Any other path, file name or depth means `recorderSetupExec` and `prosodyHostDir` must move with it before the tag ships.

- jicofo reads `ENABLE_RECORDING` and `JIBRI_BREWERY_MUC` in `/defaults/jicofo.conf`; web reads `ENABLE_RECORDING` in `/defaults/settings-config.js`.
- every image, jibri's `/defaults/xmpp.conf` included, still defaults `XMPP_HIDDEN_DOMAIN` to `hidden.meet.jitsi`, the value `xmppHiddenDomain` in `startos/utils.ts` shows to the user. A variable an image stops reading is ignored without an error.

```bash
for img in prosody jicofo web jibri; do
  docker run --rm --network none --entrypoint sh ghcr.io/jitsi/${img}:stable-<build> -c \
    'grep -rnE "ENABLE_RECORDING|JIBRI_|XMPP_HIDDEN_DOMAIN|XMPP_RECORDER_DOMAIN" /defaults /etc/s6-overlay/scripts'
done
```

If a release changes which uid the containers run as, files an earlier release wrote stay owned by the old uid, and the entrypoints copy seed data with plain `cp` that fails silently on a permission error.

A Coturn bump needs its own check: `renderTurnserverConf` in `startos/utils.ts` depends on how Coturn maps `external-ip` to `relay-ip` and orders `allowed-peer-ip` before `denied-peer-ip`, so read its changelog for either, and run a forced-relay call (`#config.forceTurnRelay=true`) before shipping.
