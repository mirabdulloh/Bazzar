import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardStats } from '../../libs/dto/admin/dashboard';

@Resolver()
export class AdminDashboardResolver {
	constructor(private readonly adminDashboardService: AdminDashboardService) {}

	@Roles(MemberType.ADMIN)
	@UseGuards(AuthGuard, RolesGuard)
	@Query(() => AdminDashboardStats)
	public async getAdminDashboardStats(): Promise<AdminDashboardStats> {
		return await this.adminDashboardService.getAdminDashboardStats();
	}
}
