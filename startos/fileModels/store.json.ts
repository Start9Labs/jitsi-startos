import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Module names are pasted into prosody's Lua config, so nothing but a bare
// name may reach it. The action enforces the same pattern on its input.
export const prosodyModulePattern = '^[a-z0-9_]+$'
const prosodyModules = z
  .array(z.string().regex(new RegExp(prosodyModulePattern)))
  .catch([])

const shape = z.looseObject({
  JICOFO_AUTH_PASSWORD: z.string(),
  JVB_AUTH_PASSWORD: z.string(),
  TURN_SECRET: z.string().catch(''),

  ADMIN_PASSWORD: z.string().catch(''),

  XMPP_MODULES: prosodyModules,
  XMPP_MUC_MODULES: prosodyModules,
  XMPP_SPEAKERSTATS_MODULES: prosodyModules,
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
