import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  turnEnabled: Value.toggle({
    name: i18n('Enable TURN'),
    description: null,
    default: false,
  }),
})

export const setTurn = sdk.Action.withInput(
  'set-turn',

  async ({ effects }) => ({
    name: i18n('Configure TURN'),
    description: i18n(
      'Enable or disable the TURN relay server for participants behind restrictive NATs or firewalls. Requires a public address configured in StartOS.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({
    turnEnabled:
      (await storeJson.read((s) => s.turnEnabled).once()) || undefined,
  }),

  async ({ effects, input }) =>
    storeJson.merge(effects, { turnEnabled: input.turnEnabled }),
)
