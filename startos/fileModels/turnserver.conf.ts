import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const turnserverConf = FileHelper.string({
  base: sdk.volumes.main,
  subpath: './coturn/turnserver.conf',
})
