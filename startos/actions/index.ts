import { sdk } from '../sdk'
import { prosodyModules } from './prosodyModules'
import { resetPassword } from './resetPassword'

export const actions = sdk.Actions.of()
  .addAction(resetPassword)
  .addAction(prosodyModules)
