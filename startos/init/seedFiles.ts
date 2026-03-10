import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { getPassword } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  await storeJson.merge(effects, {
    JICOFO_AUTH_PASSWORD: getPassword(),
    JVB_AUTH_PASSWORD: getPassword(),
    TURN_SECRET: getPassword(),
  })
})
