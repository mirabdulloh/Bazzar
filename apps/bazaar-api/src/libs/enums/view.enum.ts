import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	PRODUCT = 'PRODUCT',
	ARTICLE = 'ARTICLE',
	MEMBER = 'MEMBER',
	REVIEW = 'REVIEW',
	COMMENT = 'COMMENT',
}

registerEnumType(ViewGroup, { name: 'ViewGroup' });
