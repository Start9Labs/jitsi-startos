import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  getPassword,
  isRunning,
  prosodyctlCfg,
  prosodyctlEnv,
  prosodyMounts,
  prosodyStorageMountpoint,
  prosodyUser,
  recorderSetupExec,
  renderProsodyctlCfg,
  rotateRecorderAccounts,
} from '../utils'

export const rotateRecorderPasswords = sdk.Action.withoutInput(
  'rotate-recorder-passwords',

  async () => ({
    name: i18n('Rotate Recorder Passwords'),
    description: i18n(
      "Replace both passwords of the external Jibri recorder's accounts with newly generated ones.",
    ),
    warning: i18n(
      'Saving the new passwords restarts Jitsi Meet if it is running, which ends any meeting in progress. A Jibri on this server picks them up by itself; a recorder on another server stops connecting until you give it the new connection details.',
    ),
    allowedStatuses: 'any',
    group: null,
    // While Recording is off the accounts are deleted and only the stored
    // passwords change; the accounts are created from them when it is turned
    // back on.
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const store = await storeJson.read().once()
    if (!store) throw new Error('store.json not found')

    // register-setup never changes an existing password, so the new ones are
    // registered here; `register` overwrites.
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'prosody' },
      prosodyMounts,
      'rotate-recorder-passwords',
      async (subc) => {
        await subc.execFail(
          [
            'chown',
            '-R',
            `${prosodyUser}:${prosodyUser}`,
            prosodyStorageMountpoint,
          ],
          { user: 'root' },
        )
        await rotateRecorderAccounts({
          recording: !!store.ENABLE_RECORDING,
          current: store,
          recordingNow: async () =>
            !!(await storeJson.read().once())?.ENABLE_RECORDING,
          newPassword: getPassword,
          register: async (user, host, password) => {
            await subc.execFail(
              [
                'sh',
                '-c',
                `${renderProsodyctlCfg} && ` +
                  `prosodyctl --config ${prosodyctlCfg} register ${user} ${host} "$PASSWORD"`,
              ],
              // The recorder's host is configured only with recording on.
              {
                env: {
                  ...prosodyctlEnv,
                  ENABLE_RECORDING: '1',
                  PASSWORD: password,
                },
              },
            )
          },
          // The same file-level purge main runs at a start with Recording
          // off, as the image user.
          purge: async () => {
            await subc.execFail(recorderSetupExec(false).command)
          },
          save: async (passwords) => {
            await storeJson.merge(effects, passwords)
          },
          restart: async () => {
            if (isRunning(await sdk.getStatus(effects).once()))
              await sdk.restart(effects)
          },
        })
      },
    )

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n(
        'New recorder passwords are set. Give any recorder on another server the new connection details.',
      ),
      result: null,
    }
  },
)
