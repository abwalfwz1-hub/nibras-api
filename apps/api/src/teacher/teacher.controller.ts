import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard, SchoolRoles } from '../auth/auth.guards';
import { CreateTeacherAssignmentDto } from './teacher.dto';
import { TenantTransactionService } from '../common/tenant-transaction/tenant-transaction.service';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@SchoolRoles('TEACHER', 'SCHOOL_ADMIN')
export class TeacherController {
  constructor(private readonly prisma: PrismaService, private readonly tenant: TenantTransactionService) {}
  @Get('overview')
  async overview(@Req() request: { schoolId: string }) { const schoolId = request.schoolId; return this.tenant.executeInTenantContext(schoolId, async tx => { const [students, assignments, assessments, lessons] = await Promise.all([tx.schoolMembership.count({ where: { schoolId, role: 'STUDENT', isActive: true } }), tx.assignment.findMany({ where: { schoolId }, orderBy: { dueDate: 'asc' }, take: 20, select: { id: true, title: true, dueDate: true, _count: { select: { submissions: true } } } }), tx.assessment.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, title: true, createdAt: true, versions: { where: { isPublished: true }, select: { id: true, version: true, _count: { select: { questions: true } } } } } }), tx.document.findMany({ where: { OR: [{ schoolId }, { schoolId: null }] }, orderBy: { title: 'asc' }, take: 30, select: { id: true, title: true, scope: true } })]); return { students, assignments, assessments, lessons, generatedAt: new Date().toISOString() }; }); }
  @Post('assignments')
  async createAssignment(@Req() request: { schoolId: string }, @Body() dto: CreateTeacherAssignmentDto) { const assignment = await this.tenant.executeInTenantContext(request.schoolId, tx => tx.assignment.create({ data: { schoolId: request.schoolId, title: dto.subject ? `${dto.subject} · ${dto.title}` : dto.title, dueDate: new Date(dto.dueDate) }, select: { id: true, title: true, dueDate: true } })); return { assignment }; }
}
