import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Message } from 'apps/bazaar-api/src/libs/enums/common.enum';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const roles = this.reflector.get<string[]>('roles', context.getHandler());

		// If no roles are required, allow access
		if (!roles || roles.length === 0) {
			return true;
		}

		console.info(`--- @guard() Authorization [RolesGuard]: ${roles} ---`);

		let user;

		// Handle GraphQL context
		if (context.getType() === 'graphql') {
			const gqlContext = GqlExecutionContext.create(context);
			const ctx = gqlContext.getContext();
			user = ctx.req.user; // AuthGuard already set this
		} else {
			// Handle HTTP context
			const request = context.switchToHttp().getRequest();
			user = request.user; // AuthGuard already set this
		}

		// If no user found (AuthGuard wasn't used or failed), deny access
		if (!user) {
			throw new ForbiddenException(Message.NOT_AUTHENTICATED);
		}

		// Check if user has one of the required roles
		const hasRole = roles.includes(user.memberType);

		if (!hasRole) {
			console.log(`Access denied for ${user.memberNick} - requires roles: ${roles}, has: ${user.memberType}`);
			throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
		}

		console.log('memberNick[roles] =>', user.memberNick, '- role:', user.memberType);
		return true;
	}
}
