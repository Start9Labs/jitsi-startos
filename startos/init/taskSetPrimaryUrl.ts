import { setPrimaryUrl } from '../actions/setPrimaryUrl'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getInterfaceUrls } from '../utils'

export const taskSetPrimaryUrl = sdk.setupOnInit(async (effects) => {
  const availableUrls = await getInterfaceUrls(effects)
  const url = await storeJson.read((s) => s.primaryUrl).const(effects)

  if (!url || !availableUrls.includes(url)) {
    await sdk.action.createOwnTask(effects, setPrimaryUrl, 'critical', {
      reason: i18n(
        'Jitsi requires a primary URL for video conferencing to work. Select the address participants will use to connect.',
      ),
    })
  }
})
