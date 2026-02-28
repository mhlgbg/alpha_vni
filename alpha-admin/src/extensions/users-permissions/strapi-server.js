module.exports = (plugin) => {
	const contentApiRoutes = plugin.routes['content-api']?.routes;

	if (!Array.isArray(contentApiRoutes)) {
		return plugin;
	}

	contentApiRoutes.forEach((route) => {
		if (typeof route?.path !== 'string' || !route.path.startsWith('/users')) {
			return;
		}

		route.config = route.config || {};
		route.config.policies = route.config.policies || [];
		route.config.policies.push({
			name: 'global::has-permission',
			config: {
				key: 'users',
			},
		});
	});

	return plugin;
};


