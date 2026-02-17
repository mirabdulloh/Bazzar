import { registerEnumType } from '@nestjs/graphql';

export enum ArticleCategory {
	FASHIONGUIDES = 'FASHIONGUIDES',
	TIPS = 'TIPS',
	REVIEW = 'REVIEW',
	NEWS = 'NEWS',
	OTHER = 'OTHER',
}

registerEnumType(ArticleCategory, { name: 'ArticleCategory' });

export enum ArticleStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	DELETED = 'DELETED',
}

registerEnumType(ArticleStatus, { name: 'ArticleStatus' });
