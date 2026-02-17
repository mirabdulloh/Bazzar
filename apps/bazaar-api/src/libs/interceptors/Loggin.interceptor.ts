import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);

	// tweak these as you like
	private readonly maxLen = 1500;
	private readonly skipIntrospection = true;

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const startedAt = Date.now();
		const type = context.getType<GqlContextType>();

		if (type === 'http') {
			// Optional: add HTTP logging here if needed
			return next.handle();
		}

		if (type !== 'graphql') {
			// Always return something
			return next.handle();
		}

		const gqlCtx = GqlExecutionContext.create(context);
		const gqlInfo = gqlCtx.getInfo();
		const ctx = gqlCtx.getContext<{ req?: any }>();
		const req = ctx?.req;

		const body = req?.body ?? {};
		const operationName = body?.operationName ?? gqlInfo?.operation?.name?.value ?? 'anonymous';
		const fieldName = gqlInfo?.fieldName ?? 'unknownField';
		const parentType = gqlInfo?.parentType?.name ?? 'unknownParent';
		const variables = body?.variables ?? {};

		// Skip noisy introspection queries if you want
		const queryStr: string = body?.query ?? '';
		if (this.skipIntrospection && queryStr.includes('IntrospectionQuery')) {
			return next.handle();
		}

		const userId = req?.user?.id ?? req?.user?._id ?? req?.user?.sub ?? undefined;

		// REQUEST log
		this.logger.log(
			`GQL REQUEST | op=${operationName} | ${parentType}.${fieldName}` +
				(userId ? ` | user=${userId}` : '') +
				` | vars=${this.safeStringify(variables)}` +
				` | query=${this.truncate(this.compactQuery(queryStr))}`,
			'REQUEST',
		);

		return next.handle().pipe(
			tap((data) => {
				const ms = Date.now() - startedAt;
				this.logger.log(
					`GQL RESPONSE | op=${operationName} | ${parentType}.${fieldName}` +
						(userId ? ` | user=${userId}` : '') +
						` | ${ms}ms | data=${this.truncate(this.safeStringify(data))}`,
					'RESPONSE',
				);
			}),
			catchError((err) => {
				const ms = Date.now() - startedAt;

				// try to show GraphQL-friendly error info
				const errInfo = {
					name: err?.name,
					message: err?.message,
					code: err?.extensions?.code ?? err?.code,
					path: err?.path,
				};

				this.logger.error(
					`GQL ERROR | op=${operationName} | ${parentType}.${fieldName}` +
						(userId ? ` | user=${userId}` : '') +
						` | ${ms}ms | err=${this.truncate(this.safeStringify(errInfo))}`,
					err?.stack,
					'ERROR',
				);

				return throwError(() => err);
			}),
		);
	}

	private truncate(value: string): string {
		if (!value) return '';
		return value.length > this.maxLen ? value.slice(0, this.maxLen) + '…' : value;
	}

	private compactQuery(query: string): string {
		// make query one-liner, less noisy
		return (query ?? '').replace(/\s+/g, ' ').trim();
	}

	private safeStringify(value: unknown): string {
		try {
			const seen = new WeakSet<object>();
			return JSON.stringify(
				value,
				(_k, v) => {
					if (typeof v === 'object' && v !== null) {
						if (seen.has(v)) return '[Circular]';
						seen.add(v);
					}
					if (typeof v === 'bigint') return v.toString();
					return v;
				},
				0,
			);
		} catch {
			// last resort
			return String(value);
		}
	}
}
