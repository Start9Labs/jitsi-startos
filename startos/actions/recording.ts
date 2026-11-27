import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

// Keyed like store.json, which names the switch after the variable it sets.
const inputSpec = InputSpec.of({
  ENABLE_RECORDING: Value.toggle({
    name: i18n('External Recorder'),
    description: i18n(
      "Publishes an XMPP port on your private network for a Jibri recorder you run elsewhere, and adds server-side recording through it. Run Recorder Connection Details for the settings Jibri needs. Turning it off deletes the recorder's accounts; turning it back on recreates them with the same passwords.",
    ),
    default: false,
  }),
})

export const recording = sdk.Action.withInput(
  'recording',

  {
    name: i18n('Recording'),
    description: i18n(
      'Let an external Jibri recorder record meetings. Saving a change restarts Jitsi Meet if it is running, which ends any meeting in progress.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  inputSpec,

  async () => ({
    ENABLE_RECORDING: (await storeJson.read().once())?.ENABLE_RECORDING,
  }),

  // Only the switch: main deletes Jibri's accounts while it is off, and
  // prosody recreates them from the stored passwords when it is back on.
  async ({ effects, input }) => {
    await storeJson.merge(effects, {
      ENABLE_RECORDING: input.ENABLE_RECORDING,
    })
  },
)
