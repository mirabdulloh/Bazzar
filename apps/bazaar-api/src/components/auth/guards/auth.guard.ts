import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { Message } from 'apps/bazaar-api/src/libs/enums/common.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		console.info('--- @guard() Authentication [AuthGuard] ---');

		if (context.getType<GqlContextType>() === 'graphql') {
			const gqlContext = GqlExecutionContext.create(context);
			const ctx = gqlContext.getContext();
			const request = ctx.req;

			const bearerToken = request.headers.authorization;
			if (!bearerToken) throw new BadRequestException(Message.TOKEN_NOT_EXIST);

			const token = bearerToken.split(' ')[1];
			const authMember = await this.authService.verifyToken(token);
			if (!authMember) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

			console.log('memberNick[auth] =>', authMember.memberNick);
			ctx.req.user = authMember;

			return true;
		}

		const request = context.switchToHttp().getRequest();
		const bearerToken = request.headers.authorization;
		if (!bearerToken) throw new BadRequestException(Message.TOKEN_NOT_EXIST);

		const token = bearerToken.split(' ')[1];
		const authMember = await this.authService.verifyToken(token);
		if (!authMember) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

		request.user = authMember;
		return true;
	}
}
