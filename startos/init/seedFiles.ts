import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { getPassword, prosodyEnv, prosodyMounts, prosodyPort } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  const JICOFO_AUTH_PASSWORD = getPassword()
  const JVB_AUTH_PASSWORD = getPassword()
  const TURN_SECRET = getPassword()

  await storeJson.merge(effects, {
    JICOFO_AUTH_PASSWORD,
    JVB_AUTH_PASSWORD,
    TURN_SECRET,
  })

  // Start prosody briefly so its entrypoint generates config files.
  // The resetPassword action needs /config/prosody.cfg.lua to exist.
  await sdk.Daemons.of(effects)
    .addDaemon('prosody', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'prosody' },
        prosodyMounts,
        'prosody-seed',
      ),
      exec: {
        command: sdk.useEntrypoint(),
        runAsInit: true,
        env: prosodyEnv({ JICOFO_AUTH_PASSWORD, JVB_AUTH_PASSWORD, TURN_SECRET }),
      },
      ready: {
        display: null,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, prosodyPort, {
            successMessage: '',
            errorMessage: '',
          }),
      },
      requires: [],
    })
    .runUntilSuccess(30_000)
})
