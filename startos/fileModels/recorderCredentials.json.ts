import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { recorderCredentialsFile, recorderPublicSubpath } from '../utils'

export const recorderCredentials = FileHelper.json(
  {
    base: sdk.volumes.public,
    subpath: `./${recorderPublicSubpath}/${recorderCredentialsFile}`,
  },
  z.object({
    xmppPassword: z.string(),
    recorderPassword: z.string(),
    certSha256: z.string(),
  }),
)
