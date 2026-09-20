import { Controller, Get, UseGuards } from '@nestjs/common';
import { GlobalRoles, JwtAuthGuard, RolesGuard } from '../../auth/auth.guards';
import { snapshotMetrics } from './metrics';
@Controller('ops/metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@GlobalRoles('SUPER_ADMIN', 'PLATFORM_SUPPORT')
export class MetricsController { @Get() read() { return snapshotMetrics(); } }
