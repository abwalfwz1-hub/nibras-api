import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard, SchoolRoles } from '../auth/auth.guards';
import { RecordGameAttemptDto } from './progress.dto';
import { TenantTransactionService } from '../common/tenant-transaction/tenant-transaction.service';

type RequestWithSchool = { schoolId: string; membership: { id: string } };
@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly prisma: PrismaService, private readonly tenant: TenantTransactionService) {}
  @Post('games')
  @SchoolRoles('STUDENT')
  async recordGame(@Req() request: RequestWithSchool, @Body() input: RecordGameAttemptDto) {
    if (input.score > input.total) throw new BadRequestException('SCORE_EXCEEDS_TOTAL');
    const xpEarned = Math.max(0, Math.round((input.score / input.total) * 100));
    return this.tenant.executeInTenantContext(request.schoolId, async tx => {
      if (input.clientEventId) {
        const duplicate = await tx.gameAttempt.findUnique({ where: { clientEventId: input.clientEventId } });
        if (duplicate) {
          const progress = await tx.gameProgress.findUnique({ where: { studentMembershipId_schoolId: { studentMembershipId: request.membership.id, schoolId: request.schoolId } } });
          return { id: duplicate.id, xpEarned: duplicate.xpEarned, duplicate: true, progress };
        }
      }
      const existingSession = input.gameSessionId ? await tx.gameAttempt.findUnique({ where: { gameSessionId: input.gameSessionId } }) : null;
      const existing = await tx.gameProgress.findUnique({ where: { studentMembershipId_schoolId: { studentMembershipId: request.membership.id, schoolId: request.schoolId } } });
      if (existingSession) {
        if (existingSession.schoolId !== request.schoolId || existingSession.studentMembershipId !== request.membership.id) throw new BadRequestException('GAME_SESSION_OWNER_MISMATCH');
        if (input.score <= existingSession.score) return { id: existingSession.id, xpEarned: 0, duplicate: true, conflict: 'LOWER_SCORE_IGNORED', progress: existing };
        const deltaXp = xpEarned - existingSession.xpEarned;
        const progress = await tx.gameProgress.update({ where: { studentMembershipId_schoolId: { studentMembershipId: request.membership.id, schoolId: request.schoolId } }, data: { xp: { increment: deltaXp }, coins: { increment: Math.floor(deltaXp / 10) }, level: Math.floor(((existing?.xp ?? 0) + deltaXp) / 500) + 1, lastPlayedAt: new Date() } });
        const attempt = await tx.gameAttempt.update({ where: { id: existingSession.id }, data: { score: input.score, total: input.total, xpEarned, durationMs: input.durationMs, errorSkills: input.errorSkills ? JSON.parse(JSON.stringify(input.errorSkills)) : undefined, completedAt: new Date() } });
        return { id: attempt.id, xpEarned: deltaXp, duplicate: false, conflict: 'HIGHER_SCORE_APPLIED', progress };
      }
      const nextXp = (existing?.xp ?? 0) + xpEarned;
      const progress = await tx.gameProgress.upsert({ where: { studentMembershipId_schoolId: { studentMembershipId: request.membership.id, schoolId: request.schoolId } }, create: { schoolId: request.schoolId, studentMembershipId: request.membership.id, xp: nextXp, coins: Math.floor(xpEarned / 10), level: Math.floor(nextXp / 500) + 1, streakDays: 1, lastPlayedAt: new Date() }, update: { xp: nextXp, coins: { increment: Math.floor(xpEarned / 10) }, level: Math.floor(nextXp / 500) + 1, streakDays: { increment: 1 }, lastPlayedAt: new Date() } });
      const attempt = await tx.gameAttempt.create({ data: { schoolId: request.schoolId, studentMembershipId: request.membership.id, mode: input.mode, subject: input.subject, score: input.score, total: input.total, xpEarned, durationMs: input.durationMs, clientEventId: input.clientEventId, gameSessionId: input.gameSessionId, errorSkills: input.errorSkills ? JSON.parse(JSON.stringify(input.errorSkills)) : undefined } });
      return { id: attempt.id, xpEarned, duplicate: false, progress };
    });
  }
  @Get('me')
  @SchoolRoles('STUDENT')
  async myProgress(@Req() request: RequestWithSchool) { return this.tenant.executeInTenantContext(request.schoolId, tx => Promise.all([tx.gameProgress.findUnique({ where: { studentMembershipId_schoolId: { studentMembershipId: request.membership.id, schoolId: request.schoolId } } }), tx.gameAttempt.findMany({ where: { studentMembershipId: request.membership.id, schoolId: request.schoolId }, orderBy: { completedAt: 'desc' }, take: 30 })]).then(([progress, attempts]) => ({ progress, attempts }))); }
  @Get('teacher/errors')
  @SchoolRoles('TEACHER', 'SCHOOL_ADMIN')
  async teacherErrors(@Req() request: { schoolId: string }) { return this.tenant.executeInTenantContext(request.schoolId, async tx => { const attempts = await tx.gameAttempt.findMany({ where: { schoolId: request.schoolId }, orderBy: { completedAt: 'desc' }, take: 500, include: { studentMembership: { include: { user: { select: { fullName: true } } } } } }); const skills = new Map<string, { skill: string; misses: number; students: Set<string> }>(); for (const attempt of attempts) { const items = Array.isArray(attempt.errorSkills) ? attempt.errorSkills : []; for (const item of items) { const skill = typeof item === 'object' && item && 'skill' in item ? String((item as { skill: unknown }).skill) : String(item); if (!skill) continue; const current = skills.get(skill) ?? { skill, misses: 0, students: new Set<string>() }; current.misses += 1; current.students.add(attempt.studentMembership.user.fullName); skills.set(skill, current); } } return { attempts: attempts.length, skills: [...skills.values()].map(item => ({ skill: item.skill, misses: item.misses, students: item.students.size })).sort((a, b) => b.misses - a.misses).slice(0, 20) }; }); }
  @Get('leaderboard')
  @SchoolRoles('STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'PARENT')
  async leaderboard(@Req() request: { schoolId: string }) { return this.tenant.executeInTenantContext(request.schoolId, tx => tx.gameProgress.findMany({ where: { schoolId: request.schoolId }, orderBy: [{ xp: 'desc' }, { updatedAt: 'asc' }], take: 50, include: { studentMembership: { include: { user: { select: { fullName: true } } } } } }).then(rows => rows.map((row, index) => ({ rank: index + 1, name: row.studentMembership.user.fullName, xp: row.xp, level: row.level, streakDays: row.streakDays })))); }
}
