import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { setTurn } from '../actions/setTurn'

export const taskSetTurn = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  await sdk.action.createOwnTask(effects, setTurn, 'optional', {
    reason: i18n(
      'Enable a TURN relay server to help participants behind restrictive firewalls or NATs join video calls.',
    ),
  })
})
