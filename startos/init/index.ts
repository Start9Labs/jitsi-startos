import { sdk } from '../sdk'
import { dependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { seedFiles } from './seedFiles'
import { taskSetPassword } from './taskSetPassword'
export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedFiles,
  taskSetPassword,
  setInterfaces,
  actions,
  dependencies,
)

export const uninit = sdk.setupUninit(versionGraph)
