import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  getPassword,
  prosodyctlCfg,
  prosodyctlEnv,
  prosodyMounts,
  prosodyStorageMountpoint,
  prosodyUser,
  renderProsodyctlCfg,
  xmppConfig,
} from '../utils'

export const resetPassword = sdk.Action.withoutInput(
  'reset-password',

  async ({ effects }) => {
    const hasPass = await storeJson.read((s) => s.ADMIN_PASSWORD).const(effects)

    return {
      name: hasPass
        ? i18n('Reset Admin Password')
        : i18n('Create Admin Password'),
      description: hasPass
        ? i18n('Reset the administrator password for creating meetings')
        : i18n('Create the administrator password for creating meetings'),
      warning: hasPass
        ? i18n(
            'The current admin password stops working and is replaced by a newly generated one.',
          )
        : null,
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const password = getPassword()

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'prosody' },
      prosodyMounts,
      'reset-password',
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
        // `register` overwrites an existing user.
        await subc.execFail(
          [
            'sh',
            '-c',
            `${renderProsodyctlCfg} && ` +
              `prosodyctl --config ${prosodyctlCfg} register admin ${xmppConfig.XMPP_DOMAIN} "$ADMIN_PASSWORD"`,
          ],
          { env: { ...prosodyctlEnv, ADMIN_PASSWORD: password } },
        )
      },
    )

    await storeJson.merge(effects, { ADMIN_PASSWORD: password })

    return {
      version: '1',
      title: i18n('Success'),
      message: i18n(
        'Your admin password has been set. Use these credentials to create meetings.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: 'admin',
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
