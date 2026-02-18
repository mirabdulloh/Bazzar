import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthMember = createParamDecorator((data: string, context: ExecutionContext | any) => {
	let request: any;
	if (context.contextType === 'graphql') {
		request = GqlExecutionContext.create(context).getContext().req;
	} else {
		request = context.switchToHttp().getRequest();
	}

	const member = request.user;

	if (member) return data ? member?.[data] : member;
	else return null;
});
