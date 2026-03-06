import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { getPassword } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  await storeJson.merge(effects, {
    jicofoAuthPassword: getPassword(),
    jvbAuthPassword: getPassword(),
    turnSecret: getPassword(),
  })
})
