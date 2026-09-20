import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { GlobalRoles, JwtAuthGuard } from '../auth/auth.guards';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewContentDto } from './review.dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
@GlobalRoles('CURRICULUM_MANAGER', 'SUPER_ADMIN')
export class ReviewController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  async list(@Query('contentKey') contentKey?: string) { return this.prisma.contentReview.findMany({ where: contentKey ? { contentKey } : undefined, orderBy: { createdAt: 'desc' }, take: 100 }); }
  @Post()
  async create(@Body() dto: ReviewContentDto, @Req() request: { user: { userId: string } }) { return this.prisma.contentReview.create({ data: { contentKey: dto.contentKey, status: dto.status, subjectAccuracy: dto.subjectAccuracy, languageQuality: dto.languageQuality, accessibilitySafety: dto.accessibilitySafety, sourceRights: dto.sourceRights, comment: dto.comment, schoolId: dto.schoolId, reviewerUserId: request.user.userId, reviewedAt: new Date() } }); }
}
