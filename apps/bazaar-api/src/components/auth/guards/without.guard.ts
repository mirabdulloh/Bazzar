import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';

@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		console.info('--- @guard() Authentication [WithoutGuard] ---');

		if (context.getType<GqlContextType>() === 'graphql') {
			const gqlContext = GqlExecutionContext.create(context);
			const ctx = gqlContext.getContext();
			const request = ctx.req;
			const bearerToken = request.headers.authorization;

			if (bearerToken) {
				try {
					const token = bearerToken.split(' ')[1];
					const authMember = await this.authService.verifyToken(token);
					ctx.req.user = authMember;
				} catch (err) {
					ctx.req.user = null;
				}
			} else {
				ctx.req.user = null;
			}

			console.log('memberNick[without] =>', ctx.req.user?.memberNick ?? 'none');
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const bearerToken = request.headers.authorization;

		if (bearerToken) {
			try {
				const token = bearerToken.split(' ')[1];
				const authMember = await this.authService.verifyToken(token);
				request.user = authMember;
			} catch (err) {
				request.user = null;
			}
		} else {
			request.user = null;
		}

		return true;
	}
}
