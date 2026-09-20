import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { TenantTransactionService } from './common/tenant-transaction/tenant-transaction.service';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { SyncController } from './sync/sync.controller';
import { TeacherController } from './teacher/teacher.controller';
import { LearningController } from './learning/learning.controller';
import { ProgressController } from './progress/progress.controller';
import { ReviewController } from './review/review.controller';
import { ParentController } from './parent/parent.controller';
import { MetricsController } from './common/observability/metrics.controller';
import { MetricsMiddleware } from './common/observability/metrics.middleware';

@Module({
  imports: [AuthModule],
  controllers: [HealthController, SyncController, TeacherController, LearningController, ProgressController, ReviewController, ParentController, MetricsController],
  providers: [PrismaService, TenantTransactionService],
  exports: [PrismaService, TenantTransactionService],
})
export class AppModule implements NestModule { configure(consumer: MiddlewareConsumer) { consumer.apply(MetricsMiddleware).forRoutes('*'); } }
