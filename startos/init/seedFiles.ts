import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { getPassword } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  const store = await storeJson.read().once()
  await storeJson.merge(effects, {
    ...(kind === 'install' && {
      JICOFO_AUTH_PASSWORD: getPassword(),
      JVB_AUTH_PASSWORD: getPassword(),
    }),
    ...(!store?.TURN_SECRET && { TURN_SECRET: getPassword() }),
  })
})
