const REQUEST_UID = 'api::request.request';
const ASSIGNEE_UID = 'api::request-assignee.request-assignee';
const MESSAGE_UID = 'api::request-message.request-message';
const USER_UID = 'plugin::users-permissions.user';

function parsePositiveInt(value: unknown, fallback: number) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toDateStartIso(input?: string) {
	if (!input) return null;
	return new Date(`${input}T00:00:00.000Z`).toISOString();
}

function toDateEndIso(input?: string) {
	if (!input) return null;
	return new Date(`${input}T23:59:59.999Z`).toISOString();
}

function normalizeUserBasic(user: any) {
	if (!user) return null;
	return {
		id: user.id,
		username: user.username,
		email: user.email,
	};
}

function getRelationId(value: any) {
	if (!value) return null;
	if (typeof value === 'number' || typeof value === 'string') return value;
	return value.id ?? value.documentId ?? null;
}

function hasActiveFlag() {
	return Boolean(strapi.getModel(ASSIGNEE_UID)?.attributes?.isActive);
}

async function isActiveAssignee(requestId: number, userId: number) {
	const where: Record<string, unknown> = {
		request: requestId,
		user: userId,
	};

	if (hasActiveFlag()) {
		where.isActive = true;
	}

	const existing = await strapi.db.query(ASSIGNEE_UID).findOne({ where });
	return Boolean(existing);
}

async function canAccessRequest(requestId: number, userId: number) {
	const request = await strapi.db.query(REQUEST_UID).findOne({
		where: { id: requestId },
		populate: ['requester'],
	});

	if (!request) {
		return { allowed: false, request: null as any, requesterId: null };
	}

	const requesterId = Number(getRelationId(request.requester));
	if (requesterId === userId) {
		return { allowed: true, request, requesterId };
	}

	const assignee = await isActiveAssignee(requestId, userId);
	return { allowed: assignee, request, requesterId };
}

export default {
	async find(ctx) {
		const authUser = ctx.state.user;
		if (!authUser?.id) return ctx.unauthorized('Unauthorized');

		const userId = Number(authUser.id);
		const page = parsePositiveInt(ctx.query?.page, 1);
		const pageSize = parsePositiveInt(ctx.query?.pageSize, 10);

		const fromDateIso = toDateStartIso(typeof ctx.query?.fromDate === 'string' ? ctx.query.fromDate : undefined);
		const toDateIso = toDateEndIso(typeof ctx.query?.toDate === 'string' ? ctx.query.toDate : undefined);
		const keyword = typeof ctx.query?.keyword === 'string' ? ctx.query.keyword.trim() : '';
		const requesterId = parsePositiveInt(ctx.query?.requesterId, 0);
		const status = typeof ctx.query?.status === 'string' ? ctx.query.status.trim() : '';

		const assigneeWhere: Record<string, unknown> = { user: userId };
		if (hasActiveFlag()) {
			assigneeWhere.isActive = true;
		}

		const myAssignees = await strapi.db.query(ASSIGNEE_UID).findMany({
			where: assigneeWhere,
			populate: ['request'],
		});

		const assignedRequestIds = Array.from(
			new Set(
				(myAssignees || [])
					.map((item: any) => Number(getRelationId(item.request)))
					.filter((id: number) => Number.isFinite(id) && id > 0)
			)
		);

		const accessOr: Record<string, unknown>[] = [{ requester: userId }];
		if (assignedRequestIds.length > 0) {
			accessOr.push({ id: { $in: assignedRequestIds } });
		}

		const andWhere: Record<string, unknown>[] = [{ $or: accessOr }];

		if (fromDateIso) andWhere.push({ createdAt: { $gte: fromDateIso } });
		if (toDateIso) andWhere.push({ createdAt: { $lte: toDateIso } });
		if (keyword) andWhere.push({ title: { $containsi: keyword } });
		if (requesterId > 0) andWhere.push({ requester: requesterId });
		if (status) andWhere.push({ request_status: status });

		const where = andWhere.length > 1 ? { $and: andWhere } : andWhere[0];

		const total = await strapi.db.query(REQUEST_UID).count({ where });
		const start = (page - 1) * pageSize;

		const requests = await strapi.db.query(REQUEST_UID).findMany({
			where,
			orderBy: { updatedAt: 'desc' },
			offset: start,
			limit: pageSize,
			populate: ['requester', 'request_category'],
		});

		const requestIds = requests.map((item: any) => item.id);
		let assigneeCountByRequest = new Map<number, number>();

		if (requestIds.length > 0) {
			const assigneeCountWhere: Record<string, unknown> = {
				request: {
					id: { $in: requestIds },
				},
			};
			if (hasActiveFlag()) {
				assigneeCountWhere.isActive = true;
			}

			const assigneeRows = await strapi.db.query(ASSIGNEE_UID).findMany({
				where: assigneeCountWhere,
				populate: ['request'],
			});

			assigneeCountByRequest = assigneeRows.reduce((map: Map<number, number>, row: any) => {
				const reqId = Number(getRelationId(row.request));
				if (!reqId) return map;
				map.set(reqId, (map.get(reqId) || 0) + 1);
				return map;
			}, new Map<number, number>());
		}

		ctx.body = {
			data: requests.map((item: any) => ({
				id: item.id,
				title: item.title,
				request_status: item.request_status,
				updatedAt: item.updatedAt,
				requester: normalizeUserBasic(item.requester),
				category: item.request_category,
				assigneeCount: assigneeCountByRequest.get(item.id) || 0,
			})),
			meta: {
				pagination: {
					page,
					pageSize,
					total,
					pageCount: Math.ceil(total / pageSize),
				},
			},
		};
	},

	async findOne(ctx) {
		const authUser = ctx.state.user;
		if (!authUser?.id) return ctx.unauthorized('Unauthorized');

		const requestId = Number(ctx.params.id);
		if (!Number.isInteger(requestId) || requestId <= 0) {
			return ctx.badRequest('Invalid request id');
		}

		const access = await canAccessRequest(requestId, Number(authUser.id));
		if (!access.request) return ctx.notFound('Request not found');
		if (!access.allowed) return ctx.forbidden('Forbidden');

		const request = await strapi.db.query(REQUEST_UID).findOne({
			where: { id: requestId },
			populate: ['requester', 'request_category', 'request_tags'],
		});

		const assigneeWhere: Record<string, unknown> = { request: requestId };
		if (hasActiveFlag()) {
			assigneeWhere.isActive = true;
		}

		const assignees = await strapi.db.query(ASSIGNEE_UID).findMany({
			where: assigneeWhere,
			orderBy: { createdAt: 'asc' },
			populate: ['user', 'assignedBy'],
		});

		const messages = await strapi.db.query(MESSAGE_UID).findMany({
			where: {
				request: requestId,
				visibility: true,
			},
			orderBy: { createdAt: 'asc' },
			populate: ['author'],
		});

		ctx.body = {
			data: {
				...request,
				requester: normalizeUserBasic(request?.requester),
				category: request?.request_category,
				tags: request?.request_tags || [],
				request_assignees: assignees.map((item: any) => ({
					id: item.id,
					user: normalizeUserBasic(item.user),
					request_assignee_status: item.request_assignee_status,
					progress: item.progress,
					roleType: item.roleType,
					assignedBy: normalizeUserBasic(item.assignedBy),
					assignedAt: item.assignedAt,
					isActive: item.isActive,
				})),
				request_messages: messages.map((item: any) => ({
					id: item.id,
					author: normalizeUserBasic(item.author),
					content: item.content,
					createdAt: item.createdAt,
				})),
			},
		};
	},

	async create(ctx) {
		const authUser = ctx.state.user;
		if (!authUser?.id) return ctx.unauthorized('Unauthorized');

		const body = ctx.request.body || {};
		const title = typeof body.title === 'string' ? body.title.trim() : '';

		if (!title) {
			return ctx.badRequest('title is required');
		}

		const data: Record<string, unknown> = {
			title,
			requester: Number(authUser.id),
			request_status: 'OPEN',
		};

		if (typeof body.description === 'string') data.description = body.description;

		const categoryId = Number(body.categoryId);
		if (Number.isInteger(categoryId) && categoryId > 0) {
			data.request_category = categoryId;
		}

		if (Array.isArray(body.tagIds)) {
			const tagIds = body.tagIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0);
			if (tagIds.length > 0) {
				data.request_tags = tagIds;
			}
		}

		if (body.amount !== undefined && body.amount !== null && body.amount !== '') {
			data.amountProposed = body.amount;
		}

		if (typeof body.currency === 'string' && body.currency.trim()) {
			data.currency = body.currency.trim();
		}

		const created = await strapi.db.query(REQUEST_UID).create({
			data,
			populate: ['requester', 'request_category', 'request_tags'],
		});

		ctx.body = {
			data: created,
		};
	},

	async update(ctx) {
		const authUser = ctx.state.user;
		if (!authUser?.id) return ctx.unauthorized('Unauthorized');

		const requestId = Number(ctx.params.id);
		if (!Number.isInteger(requestId) || requestId <= 0) {
			return ctx.badRequest('Invalid request id');
		}

		const request = await strapi.db.query(REQUEST_UID).findOne({
			where: { id: requestId },
			populate: ['requester'],
		});

		if (!request) return ctx.notFound('Request not found');

		const requesterId = Number(getRelationId(request.requester));
		if (requesterId !== Number(authUser.id)) {
			return ctx.forbidden('Forbidden');
		}

		const body = ctx.request.body || {};
		const data: Record<string, unknown> = {};

		if (typeof body.title === 'string') data.title = body.title.trim();
		if (typeof body.description === 'string') data.description = body.description;

		if (body.categoryId !== undefined) {
			const categoryId = Number(body.categoryId);
			data.request_category = Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null;
		}

		if (Array.isArray(body.tagIds)) {
			const tagIds = body.tagIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0);
			data.request_tags = tagIds;
		}

		if (body.amount !== undefined) {
			data.amountProposed = body.amount === '' ? null : body.amount;
		}

		if (body.currency !== undefined) {
			data.currency = typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim() : null;
		}

		const updated = await strapi.db.query(REQUEST_UID).update({
			where: { id: requestId },
			data,
			populate: ['requester', 'request_category', 'request_tags'],
		});

		ctx.body = {
			data: updated,
		};
	},

	async updateStatus(ctx) {
		const authUser = ctx.state.user;
		if (!authUser?.id) return ctx.unauthorized('Unauthorized');

		const requestId = Number(ctx.params.id);
		if (!Number.isInteger(requestId) || requestId <= 0) {
			return ctx.badRequest('Invalid request id');
		}

		const status = typeof ctx.request.body?.status === 'string' ? ctx.request.body.status.trim() : '';
		const statusEnum: string[] =
			(strapi.getModel(REQUEST_UID)?.attributes?.request_status?.enum as string[] | undefined) || [];

		if (!status || !statusEnum.includes(status)) {
			return ctx.badRequest('Invalid status');
		}

		const access = await canAccessRequest(requestId, Number(authUser.id));
		if (!access.request) return ctx.notFound('Request not found');
		if (!access.allowed) return ctx.forbidden('Forbidden');

		const updated = await strapi.db.query(REQUEST_UID).update({
			where: { id: requestId },
			data: { request_status: status },
		});

		ctx.body = {
			data: {
				id: updated.id,
				request_status: updated.request_status,
			},
		};
	},

	async addAssignee(ctx) {
		const authUser = ctx.state.user;
		if (!authUser?.id) return ctx.unauthorized('Unauthorized');

		const requestId = Number(ctx.params.id);
		if (!Number.isInteger(requestId) || requestId <= 0) {
			return ctx.badRequest('Invalid request id');
		}

		const request = await strapi.db.query(REQUEST_UID).findOne({
			where: { id: requestId },
			populate: ['requester'],
		});

		if (!request) return ctx.notFound('Request not found');

		const requesterId = Number(getRelationId(request.requester));
		if (requesterId !== Number(authUser.id)) {
			return ctx.forbidden('Forbidden');
		}

		const userId = Number(ctx.request.body?.userId);
		if (!Number.isInteger(userId) || userId <= 0) {
			return ctx.badRequest('Invalid userId');
		}

		const targetUser = await strapi.db.query(USER_UID).findOne({
			where: { id: userId },
			select: ['id'],
		});

		if (!targetUser) {
			return ctx.badRequest('userId does not exist');
		}

		const duplicateWhere: Record<string, unknown> = {
			request: requestId,
			user: userId,
		};
		if (hasActiveFlag()) {
			duplicateWhere.isActive = true;
		}

		const existing = await strapi.db.query(ASSIGNEE_UID).findOne({ where: duplicateWhere });
		if (existing) {
			return ctx.badRequest('Assignee already exists');
		}

		const roleType = typeof ctx.request.body?.role === 'string' ? ctx.request.body.role.trim() : '';
		const roleEnum: string[] =
			(strapi.getModel(ASSIGNEE_UID)?.attributes?.roleType?.enum as string[] | undefined) || [];

		const data: Record<string, unknown> = {
			request: requestId,
			user: userId,
			assignedBy: Number(authUser.id),
			assignedAt: new Date(),
			isActive: true,
		};

		if (roleType && roleEnum.includes(roleType)) {
			data.roleType = roleType;
		}

		const created = await strapi.db.query(ASSIGNEE_UID).create({
			data,
			populate: ['user', 'assignedBy'],
		});

		ctx.body = {
			data: created,
		};
	},

	async removeAssignee(ctx) {
		const authUser = ctx.state.user;
		if (!authUser?.id) return ctx.unauthorized('Unauthorized');

		const requestId = Number(ctx.params.id);
		const assigneeId = Number(ctx.params.assigneeId);

		if (!Number.isInteger(requestId) || requestId <= 0 || !Number.isInteger(assigneeId) || assigneeId <= 0) {
			return ctx.badRequest('Invalid params');
		}

		const request = await strapi.db.query(REQUEST_UID).findOne({
			where: { id: requestId },
			populate: ['requester'],
		});

		if (!request) return ctx.notFound('Request not found');

		const requesterId = Number(getRelationId(request.requester));
		if (requesterId !== Number(authUser.id)) {
			return ctx.forbidden('Forbidden');
		}

		const assignee = await strapi.db.query(ASSIGNEE_UID).findOne({
			where: { id: assigneeId, request: requestId },
		});

		if (!assignee) {
			return ctx.notFound('Assignee not found');
		}

		await strapi.db.query(ASSIGNEE_UID).update({
			where: { id: assigneeId },
			data: {
				isActive: false,
				removedAt: new Date(),
			},
		});

		ctx.body = { ok: true };
	},

	async listMessages(ctx) {
		const authUser = ctx.state.user;
		if (!authUser?.id) return ctx.unauthorized('Unauthorized');

		const requestId = Number(ctx.params.id);
		if (!Number.isInteger(requestId) || requestId <= 0) {
			return ctx.badRequest('Invalid request id');
		}

		const access = await canAccessRequest(requestId, Number(authUser.id));
		if (!access.request) return ctx.notFound('Request not found');
		if (!access.allowed) return ctx.forbidden('Forbidden');

		const messages = await strapi.db.query(MESSAGE_UID).findMany({
			where: {
				request: requestId,
				visibility: true,
			},
			orderBy: { createdAt: 'asc' },
			populate: ['author'],
		});

		ctx.body = {
			data: messages.map((item: any) => ({
				id: item.id,
				content: item.content,
				createdAt: item.createdAt,
				author: normalizeUserBasic(item.author),
			})),
		};
	},

	async createMessage(ctx) {
		const authUser = ctx.state.user;
		if (!authUser?.id) return ctx.unauthorized('Unauthorized');

		const requestId = Number(ctx.params.id);
		if (!Number.isInteger(requestId) || requestId <= 0) {
			return ctx.badRequest('Invalid request id');
		}

		const access = await canAccessRequest(requestId, Number(authUser.id));
		if (!access.request) return ctx.notFound('Request not found');
		if (!access.allowed) return ctx.forbidden('Forbidden');

		const content = typeof ctx.request.body?.content === 'string' ? ctx.request.body.content.trim() : '';
		if (!content) {
			return ctx.badRequest('content is required');
		}

		const created = await strapi.db.query(MESSAGE_UID).create({
			data: {
				request: requestId,
				author: Number(authUser.id),
				content,
				visibility: true,
			},
			populate: ['author'],
		});

		ctx.body = {
			data: {
				id: created.id,
				content: created.content,
				createdAt: created.createdAt,
				author: normalizeUserBasic(created.author),
			},
		};
	},
};
