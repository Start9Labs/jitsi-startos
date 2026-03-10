import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  JICOFO_AUTH_PASSWORD: z.string(),
  JVB_AUTH_PASSWORD: z.string(),
  TURN_SECRET: z.string(),
  turnEnabled: z.boolean().catch(false),
  ADMIN_PASSWORD: z.string().catch(''),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
