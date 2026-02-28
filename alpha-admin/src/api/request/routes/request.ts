const requestsPolicy = [
	{
		name: 'global::has-permission',
		config: {
			key: 'requests',
		},
	},
];

export default {
	routes: [
		{
			method: 'GET',
			path: '/requests',
			handler: 'request.find',
			config: {
				auth: { scope: [] },
				policies: requestsPolicy,
			},
		},
		{
			method: 'GET',
			path: '/requests/:id',
			handler: 'request.findOne',
			config: {
				auth: { scope: [] },
				policies: requestsPolicy,
			},
		},
		{
			method: 'POST',
			path: '/requests',
			handler: 'request.create',
			config: {
				auth: { scope: [] },
				policies: requestsPolicy,
			},
		},
		{
			method: 'PUT',
			path: '/requests/:id',
			handler: 'request.update',
			config: {
				auth: { scope: [] },
				policies: requestsPolicy,
			},
		},
		{
			method: 'POST',
			path: '/requests/:id/status',
			handler: 'request.updateStatus',
			config: {
				auth: { scope: [] },
				policies: requestsPolicy,
			},
		},
		{
			method: 'POST',
			path: '/requests/:id/assignees',
			handler: 'request.addAssignee',
			config: {
				auth: { scope: [] },
				policies: requestsPolicy,
			},
		},
		{
			method: 'DELETE',
			path: '/requests/:id/assignees/:assigneeId',
			handler: 'request.removeAssignee',
			config: {
				auth: { scope: [] },
				policies: requestsPolicy,
			},
		},
		{
			method: 'GET',
			path: '/requests/:id/messages',
			handler: 'request.listMessages',
			config: {
				auth: { scope: [] },
				policies: requestsPolicy,
			},
		},
		{
			method: 'POST',
			path: '/requests/:id/messages',
			handler: 'request.createMessage',
			config: {
				auth: { scope: [] },
				policies: requestsPolicy,
			},
		},
	],
};
