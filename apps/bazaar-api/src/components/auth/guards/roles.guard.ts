import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Message } from 'apps/bazaar-api/src/libs/enums/common.enum';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const roles = this.reflector.get<string[]>('roles', context.getHandler());
		if (!roles || roles.length === 0) return true;

		console.info(`--- @guard() Authentication [RolesGuard]: ${roles} ---`);

		let user: any;

		if (context.getType<GqlContextType>() === 'graphql') {
			const gqlContext = GqlExecutionContext.create(context);
			const ctx = gqlContext.getContext();
			user = ctx.req.user;
		} else {
			const request = context.switchToHttp().getRequest();
			user = request.user;
		}

		if (!user) throw new ForbiddenException(Message.NOT_AUTHENTICATED);

		const hasRole = roles.includes(user.memberType);
		if (!hasRole) throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);

		console.log('memberNick[roles] =>', user.memberNick);
		return true;
	}
}
