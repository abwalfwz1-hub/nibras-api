import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, SchoolRoles } from '../auth/auth.guards';
import { TenantTransactionService } from '../common/tenant-transaction/tenant-transaction.service';

type ParentRequest = { schoolId: string; membership: { id: string } };

@Controller('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@SchoolRoles('PARENT')
export class ParentController {
  constructor(private readonly tenant: TenantTransactionService) {}

  @Get('children')
  async children(@Req() request: ParentRequest) {
    return this.tenant.executeInTenantContext(request.schoolId, tx => tx.parentStudent.findMany({
      where: { schoolId: request.schoolId, parentMembershipId: request.membership.id, status: 'ACTIVE' },
      select: { id: true, status: true, studentMembership: { select: { id: true, user: { select: { fullName: true, email: true } } } } },
    }));
  }
}
