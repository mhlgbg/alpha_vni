type PolicyConfig = {
  key?: string;
};

export default async (policyContext, config: PolicyConfig = {}) => {
  const requiredKey = config?.key;

  if (!requiredKey) {
    return policyContext.forbidden('Permission key is required');
  }

  const authUser = policyContext.state?.user;
  if (!authUser?.id) {
    return policyContext.forbidden('Forbidden');
  }

  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: authUser.id },
    populate: ['role'],
  });

  const roleId = user?.role?.id;
  if (!roleId) {
    return policyContext.forbidden('Forbidden');
  }

  const mappings = await strapi.db.query('api::role-feature.role-feature').findMany({
    where: { role: roleId },
    populate: ['feature'],
  });

  const permissionKeys = new Set(
    (mappings || [])
      .map((item) => item?.feature?.key)
      .filter((key): key is string => typeof key === 'string' && key.length > 0)
  );

  if (!permissionKeys.has(requiredKey)) {
    return policyContext.forbidden('Forbidden');
  }

  return true;
};
