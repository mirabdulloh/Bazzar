import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	PRODUCT = 'PRODUCT',
	ARTICLE = 'ARTICLE',
	MEMBER = 'MEMBER',
	BRAND = 'BRAND',
	REVIEW = 'REVIEW',
	COMMENT = 'COMMENT',
}

registerEnumType(LikeGroup, { name: 'LikeGroup' });
