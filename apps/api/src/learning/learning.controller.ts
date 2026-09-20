import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard, SchoolRoles } from '../auth/auth.guards';
import { TenantTransactionService } from '../common/tenant-transaction/tenant-transaction.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@SchoolRoles('TEACHER', 'SCHOOL_ADMIN', 'STUDENT', 'PARENT')
export class LearningController {
  constructor(private readonly prisma: PrismaService, private readonly tenant: TenantTransactionService) {}
  @Get('lessons')
  async lessons(@Req() request: { schoolId: string }) { return this.tenant.executeInTenantContext(request.schoolId, tx => tx.document.findMany({ where: { OR: [{ schoolId: request.schoolId }, { schoolId: null }] }, orderBy: { title: 'asc' }, select: { id: true, title: true, content: true, scope: true } })); }
  @Get('assessments')
  async assessments(@Req() request: { schoolId: string }) { return this.tenant.executeInTenantContext(request.schoolId, tx => tx.assessment.findMany({ where: { schoolId: request.schoolId }, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, createdAt: true, versions: { where: { isPublished: true }, orderBy: { version: 'desc' }, take: 1, select: { id: true, version: true, _count: { select: { questions: true } } } } } })); }
  @Get('assignments')
  async assignments(@Req() request: { schoolId: string }) { return this.tenant.executeInTenantContext(request.schoolId, tx => tx.assignment.findMany({ where: { schoolId: request.schoolId }, orderBy: { dueDate: 'asc' }, select: { id: true, title: true, dueDate: true, _count: { select: { submissions: true } } } })); }
}
