import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_2_0_11146_2 } from './v2.0.11146_2'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_2_0_11146_2],
})
