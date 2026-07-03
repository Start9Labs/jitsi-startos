import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getPassword, prosodyEnv, prosodyMounts, prosodyPort } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind, progress) => {
  if (kind === 'install') {
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
    const phase = progress.addPhase(i18n('Generating XMPP configuration'))
    phase.start()
    await sdk.Daemons.of(effects)
      .addDaemon('prosody', {
        subcontainer: sdk.SubContainer.of(
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
      .runUntilSuccess(300_000)
    phase.complete()
  } else {
    await storeJson.merge(effects, {})
  }
})
