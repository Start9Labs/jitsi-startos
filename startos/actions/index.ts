import { sdk } from '../sdk'
import { setPrimaryUrl } from './setPrimaryUrl'

export const actions = sdk.Actions.of().addAction(setPrimaryUrl)
