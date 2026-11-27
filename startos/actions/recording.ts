import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

// Keyed like store.json, which names each switch after the variable it sets.
export const recordingInputSpec = InputSpec.of({
  ENABLE_RECORDING: Value.toggle({
    name: i18n('Recording'),
    description: i18n(
      'Let a Jibri recorder record meetings. Install the Jibri service on this server, or run Jibri on another server and allow it below.',
    ),
    default: false,
  }),
  RECORDING_REMOTE: Value.toggle({
    name: i18n('Allow recorders on other servers'),
    description: i18n(
      'Adds a Recorder XMPP interface on your private network for a Jibri on another server. Recorder Connection Details then shows what it needs.',
    ),
    default: false,
  }),
  ENABLE_LIVESTREAMING: Value.toggle({
    name: i18n('Live streaming'),
    description: i18n(
      'Lets a moderator stream a meeting through Jibri to an RTMP address, such as Owncast or YouTube.',
    ),
    default: false,
  }),
})

export const recording = sdk.Action.withInput(
  'recording',

  {
    name: i18n('Recording'),
    description: i18n(
      'Record meetings, or stream them live, through a Jibri recorder. Saving a change restarts Jitsi Meet if it is running, which ends any meeting in progress.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  recordingInputSpec,

  async () => {
    const store = await storeJson.read().once()
    return {
      ENABLE_RECORDING: store?.ENABLE_RECORDING,
      RECORDING_REMOTE: store?.RECORDING_REMOTE,
      ENABLE_LIVESTREAMING: store?.ENABLE_LIVESTREAMING,
    }
  },

  // Only the switches: main deletes Jibri's accounts while Recording is off,
  // and prosody recreates them from the stored passwords when it is back on.
  async ({ effects, input }) => {
    await storeJson.merge(effects, input)
  },
)
