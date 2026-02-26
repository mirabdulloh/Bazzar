import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FaqService } from './faq.service';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Faq, Faqs } from '../../libs/dto/faqs/faq';
import { FaqInput, FaqsInquiry } from '../../libs/dto/faqs/faq.input';
import { FaqUpdate } from '../../libs/dto/faqs/faq.update';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class FaqResolver {
	constructor(private readonly faqService: FaqService) {}

	/** ADMIN */

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Faq)
	public async createFaqByAdmin(@Args('input') input: FaqInput): Promise<Faq> {
		console.log('Mutation: createFaqByAdmin');
		return await this.faqService.createFaqByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Faq)
	public async updateFaqByAdmin(@Args('input') input: FaqUpdate): Promise<Faq> {
		console.log('Mutation: updateFaqByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.faqService.updateFaqByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => Faq)
	public async removeFaqByAdmin(@Args('faqId') faqId: string): Promise<Faq> {
		console.log('Mutation: removeFaqByAdmin');
		const id = shapeIntoMongoObjectId(faqId);
		return await this.faqService.removeFaqByAdmin(id);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => Faqs)
	public async getAllFaqsByAdmin(@Args('input') input: FaqsInquiry): Promise<Faqs> {
		console.log('Query: getAllFaqsByAdmin');
		return await this.faqService.getAllFaqsByAdmin(input);
	}

	/** USER */

	@UseGuards(WithoutGuard)
	@Query(() => Faqs)
	public async getFaqs(@Args('input') input: FaqsInquiry): Promise<Faqs> {
		console.log('Query: getFaqs');
		return await this.faqService.getFaqs(input);
	}
}
