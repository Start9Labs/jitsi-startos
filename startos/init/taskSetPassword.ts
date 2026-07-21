import { resetPassword } from '../actions/resetPassword'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const taskSetPassword = sdk.setupOnInit(async (effects) => {
  if (!(await storeJson.read((s) => s.ADMIN_PASSWORD).const(effects))) {
    await sdk.action.createOwnTask(effects, resetPassword, 'critical', {
      reason: i18n('Create an admin password so only you can start meetings.'),
    })
  }
})
