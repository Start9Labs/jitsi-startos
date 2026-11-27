import { sdk } from '../sdk'
import { prosodyModules } from './prosodyModules'
import { recorderDetails } from './recorderDetails'
import { recording } from './recording'
import { resetPassword } from './resetPassword'
import { rotateRecorderPasswords } from './rotateRecorderPasswords'

export const actions = sdk.Actions.of()
  .addAction(resetPassword)
  .addAction(prosodyModules)
  .addAction(recording)
  .addAction(recorderDetails)
  .addAction(rotateRecorderPasswords)
