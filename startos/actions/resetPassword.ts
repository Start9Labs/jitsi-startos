import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  getPassword,
  prosodyMounts,
  prosodyStorageMountpoint,
  prosodyUser,
  xmppConfig,
} from '../utils'

const cfgDir = '/tmp/prosody-config'

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
      warning: null,
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
        // The running container generates its config under /run, so render a
        // throwaway copy from the same templates to register against the
        // accounts on the storage volume. `register` overwrites an existing user.
        await subc.execFail(
          [
            'sh',
            '-c',
            `mkdir -p ${cfgDir}/conf.d ${cfgDir}/certs && ` +
              `tpl /defaults/prosody.cfg.lua > ${cfgDir}/prosody.cfg.lua && ` +
              `tpl /defaults/conf.d/jitsi-meet.cfg.lua > ${cfgDir}/conf.d/jitsi-meet.cfg.lua && ` +
              `prosodyctl --config ${cfgDir}/prosody.cfg.lua register admin ${xmppConfig.XMPP_DOMAIN} "$ADMIN_PASSWORD"`,
          ],
          {
            env: {
              ...xmppConfig,
              ENABLE_AUTH: '1',
              ENABLE_GUESTS: '1',
              AUTH_TYPE: 'internal',
              ADMIN_PASSWORD: password,
            },
          },
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
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
