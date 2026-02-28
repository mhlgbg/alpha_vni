import crypto from 'node:crypto';

export default {
  async activate(ctx) {
    try {
      const rawToken = ctx.request.body?.token;
      const token = typeof rawToken === 'string' ? rawToken.trim() : '';

      if (!token) {
        return ctx.badRequest('token is required');
      }

      const activationToken = await strapi.db
        .query('api::activation-token.activation-token')
        .findOne({
          where: { token },
          populate: ['user'],
        });

      if (!activationToken) {
        return ctx.badRequest('Invalid token');
      }

      if (activationToken.usedAt) {
        return ctx.badRequest('Token already used');
      }

      const expiresAtMs = new Date(activationToken.expiresAt).getTime();
      if (Number.isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
        return ctx.badRequest('Token expired');
      }

      const userId = activationToken.user?.id ?? activationToken.user;
      if (!userId) {
        return ctx.badRequest('Invalid token');
      }

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: { confirmed: true },
      });

      await strapi.db.query('api::activation-token.activation-token').update({
        where: { id: activationToken.id },
        data: { usedAt: new Date() },
      });

      const resetPasswordToken = crypto.randomBytes(48).toString('base64url');
      const resetPasswordTokenExpiration = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const userModel = strapi.getModel('plugin::users-permissions.user');
      const userAttributes = userModel?.attributes as Record<string, unknown> | undefined;

      const userUpdateData: Record<string, unknown> = {
        resetPasswordToken,
      };

      const userProvider =
        (activationToken.user && typeof activationToken.user === 'object'
          ? (activationToken.user as { provider?: string | null }).provider
          : null) || null;

      if (!userProvider) {
        userUpdateData.provider = 'local';
      }

      if (userAttributes && 'resetPasswordTokenExpiration' in userAttributes) {
        userUpdateData.resetPasswordTokenExpiration = resetPasswordTokenExpiration;
      }

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: userUpdateData,
      });

      ctx.body = {
        ok: true,
        message: 'Account activated successfully',
        resetPasswordToken,
      };
    } catch {
      return ctx.internalServerError('Failed to activate account');
    }
  },
};
