// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi } /* : { strapi: Core.Strapi } */) {
    const frontendUrlRaw = process.env.FRONTEND_URL?.trim();
    const frontendUrl = frontendUrlRaw?.replace(/\/+$/, '');

    if (!frontendUrl) {
      strapi.log.warn('[bootstrap] FRONTEND_URL is empty, skip users-permissions reset password URL sync');
      return;
    }

    const resetPasswordUrl = `${frontendUrl}/reset-password`;

    const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
    const advanced = ((await pluginStore.get({ key: 'advanced' })) || {}) as Record<string, unknown>;

    if (!advanced.email_reset_password) {
      await pluginStore.set({
        key: 'advanced',
        value: {
          ...advanced,
          email_reset_password: resetPasswordUrl,
        },
      });

      strapi.log.info(`[bootstrap] users-permissions advanced.email_reset_password set to ${resetPasswordUrl}`);
    }
  },
};
