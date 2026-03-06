import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  jicofoAuthPassword: z.string(),
  jvbAuthPassword: z.string(),
  turnSecret: z.string(),
  primaryUrl: z.string().catch(''),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
