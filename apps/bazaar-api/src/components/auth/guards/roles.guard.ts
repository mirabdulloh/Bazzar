import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Message } from '../../../libs/enums/common.enum';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const roles = this.reflector.get<string[]>('roles', context.getHandler());
		if (!roles) return true;

		console.info(`--- @guard() Authentication [RolesGuard]: ${roles} ---`);

		const ctxType = context.getType<GqlContextType>();
		const request =
			ctxType === 'graphql'
				? GqlExecutionContext.create(context).getContext().req
				: context.switchToHttp().getRequest();

		const authMember = request?.user;
		if (!authMember) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

		const hasPermission = roles.includes(authMember.memberType);
		if (!hasPermission) throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);

		console.log('memberNick[roles] =>', authMember.memberNick);
		return true;
	}
}
