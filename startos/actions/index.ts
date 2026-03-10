import { sdk } from '../sdk'
import { resetPassword } from './resetPassword'
import { setTurn } from './setTurn'

export const actions = sdk.Actions.of().addAction(resetPassword).addAction(setTurn)
