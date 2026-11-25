import { prosodyModulePattern, storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, List, Value } = sdk

const modules = (name: string, description: string) =>
  Value.list(
    List.text(
      { name, description, default: [] },
      {
        patterns: [
          {
            regex: prosodyModulePattern,
            description: i18n(
              'Lowercase letters, digits and underscores only, without the "mod_" prefix or the ".lua" ending.',
            ),
          },
        ],
      },
    ),
  )

// Keys mirror store.json, which names each list after the variable it becomes.
const inputSpec = InputSpec.of({
  XMPP_MODULES: modules(
    i18n('Virtual Host Modules'),
    i18n('Loaded on the main and guest virtual hosts.'),
  ),
  XMPP_MUC_MODULES: modules(
    i18n('Conference Room Modules'),
    i18n('Loaded on the conference room component.'),
  ),
  XMPP_SPEAKERSTATS_MODULES: modules(
    i18n('Speaker Stats Modules'),
    i18n('Loaded on the speaker stats component.'),
  ),
})

export const prosodyModules = sdk.Action.withInput(
  'prosody-modules',

  {
    name: i18n('Prosody Modules'),
    description: i18n(
      'Choose additional Prosody modules to load. Saving restarts Jitsi Meet if it is running, which ends any meeting in progress.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  inputSpec,

  async () => {
    const store = await storeJson.read().once()
    return {
      XMPP_MODULES: store?.XMPP_MODULES,
      XMPP_MUC_MODULES: store?.XMPP_MUC_MODULES,
      XMPP_SPEAKERSTATS_MODULES: store?.XMPP_SPEAKERSTATS_MODULES,
    }
  },

  async ({ effects, input }) => {
    // An empty item passes the pattern check but not store.json's shape,
    // which would read the whole list as empty.
    const named = (names: string[]) => names.filter((n) => n !== '')
    await storeJson.merge(effects, {
      XMPP_MODULES: named(input.XMPP_MODULES),
      XMPP_MUC_MODULES: named(input.XMPP_MUC_MODULES),
      XMPP_SPEAKERSTATS_MODULES: named(input.XMPP_SPEAKERSTATS_MODULES),
    })
  },
)
