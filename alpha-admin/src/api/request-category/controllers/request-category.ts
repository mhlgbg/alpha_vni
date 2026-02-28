/**
 * request-category controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::request-category.request-category', () => ({
	async find(ctx) {
		if (!ctx.state.user?.id) {
			return ctx.unauthorized('Unauthorized');
		}

		const model = strapi.getModel('api::request-category.request-category');
		const attributes = (model?.attributes || {}) as Record<string, unknown>;
		const hasOrderField = 'order' in attributes;

		const orderBy = hasOrderField ? [{ order: 'asc' }, { name: 'asc' }] : [{ name: 'asc' }];

		const categories = await strapi.db.query('api::request-category.request-category').findMany({
			where: {
				isActive: true,
			},
			orderBy,
		});

		ctx.body = {
			data: categories,
			meta: {
				total: categories.length,
			},
		};
	},
}));
