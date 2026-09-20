import { BadRequestException, Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard, RolesGuard, SchoolRoles } from '../auth/auth.guards';
import { TenantTransactionService } from '../common/tenant-transaction/tenant-transaction.service';
import { SyncEventsDto } from './sync.dto';
import { recordMetric } from '../common/observability/metrics';

const MAX_BATCH_SIZE = 100;
type SyncRequest = { schoolId: string; user?: { sub?: string }; membership?: { id: string } };

@Controller('sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@SchoolRoles('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN')
export class SyncController {
  constructor(private readonly tenant: TenantTransactionService) {}

  @Post('events')
  async acceptEvents(@Req() request: SyncRequest, @Body() body: SyncEventsDto) {
    if (body.events.length > MAX_BATCH_SIZE) throw new BadRequestException(`A sync batch cannot exceed ${MAX_BATCH_SIZE} events`);
    const accepted: string[] = [];
    const duplicates: string[] = [];
    const rejected: Array<{ id: string; reason: string }> = [];
    await this.tenant.executeInTenantContext(request.schoolId, async tx => {
      for (const event of body.events) {
        try {
          await tx.learningEvent.create({ data: { id: event.id, schoolId: request.schoolId, deviceId: event.deviceId ?? request.user?.sub ?? 'unknown-device', sequenceNumber: BigInt(event.sequenceNumber ?? Date.parse(event.createdAt)), eventType: event.type, clientTimestamp: new Date(event.createdAt), payload: event.payload as Prisma.InputJsonValue } });
          accepted.push(event.id);
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { duplicates.push(event.id); recordMetric('duplicateEvents'); }
          else { rejected.push({ id: event.id, reason: 'EVENT_REJECTED' }); recordMetric('syncFailures'); }
        }
      }
    });
    return { accepted, duplicates, rejected, receivedAt: new Date().toISOString() };
  }
}
