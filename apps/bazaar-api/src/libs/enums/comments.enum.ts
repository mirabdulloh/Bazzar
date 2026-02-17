import { registerEnumType } from '@nestjs/graphql';

export enum CommentStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	DELETED = 'DELETED',
}

registerEnumType(CommentStatus, { name: 'CommentStatus' });

export enum CommentGroup {
	PRODUCT = 'PRODUCT',
	ARTICLE = 'ARTICLE',
	BRAND = 'BRAND',
	REVIEW = 'REVIEW',
}
