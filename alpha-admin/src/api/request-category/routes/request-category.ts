/**
 * request-category router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::request-category.request-category', {
	config: {
		find: {
			policies: [
				{
					name: 'global::has-permission',
					config: {
						key: 'request-categories',
					},
				},
			],
		},
		findOne: {
			policies: [
				{
					name: 'global::has-permission',
					config: {
						key: 'request-categories',
					},
				},
			],
		},
		create: {
			policies: [
				{
					name: 'global::has-permission',
					config: {
						key: 'request-categories',
					},
				},
			],
		},
		update: {
			policies: [
				{
					name: 'global::has-permission',
					config: {
						key: 'request-categories',
					},
				},
			],
		},
		delete: {
			policies: [
				{
					name: 'global::has-permission',
					config: {
						key: 'request-categories',
					},
				},
			],
		},
	},
});
