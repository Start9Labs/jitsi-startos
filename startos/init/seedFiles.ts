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
    // Never replaced here: prosody keeps the password an account was created
    // with, so only the Rotate Recorder Passwords action, which re-registers
    // the accounts, may change them.
    ...(!store?.JIBRI_XMPP_PASSWORD && {
      JIBRI_XMPP_PASSWORD: getPassword(),
    }),
    ...(!store?.JIBRI_RECORDER_PASSWORD && {
      JIBRI_RECORDER_PASSWORD: getPassword(),
    }),
  })
})
