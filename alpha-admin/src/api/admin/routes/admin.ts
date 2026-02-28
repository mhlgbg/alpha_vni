export default {
  routes: [
    {
      method: 'POST',
      path: '/admin/invite-user',
      handler: 'admin.inviteUser',
      config: {
        auth: {
          scope: [],
        },
        policies: [
          {
            name: 'global::has-permission',
            config: {
              key: 'invite-user',
            },
          },
        ],
      },
    },
  ],
};
