import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';

@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		console.info('--- @guard() Authentication [WithoutGuard] ---');

		// Handle GraphQL context
		if (context.getType() === 'graphql') {
			const gqlContext = GqlExecutionContext.create(context);
			const ctx = gqlContext.getContext();
			const request = ctx.req;

			const bearerToken = request.headers.authorization;

			if (bearerToken) {
				try {
					const token = bearerToken.split(' ')[1];
					const authMember = await this.authService.verifyToken(token);
					ctx.req.user = authMember; // Store in context
				} catch (err) {
					ctx.req.user = null; // Invalid token, set to null
				}
			} else {
				ctx.req.user = null; // No token provided
			}

			console.log('memberNick[without] =>', ctx.req.user?.memberNick ?? 'none');
			return true; // Always allow access
		}

		// Handle HTTP context
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

		return true; // Always allow access
	}
}
