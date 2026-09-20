import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async executeInTenantContext<T>(
    schoolId: string,
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (!schoolId || !UUID_REGEX.test(schoolId)) {
      throw new BadRequestException('INVALID_TENANT_SCOPE');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT set_config('app.current_school_id', ${schoolId}, true);
      `;
      return operation(tx);
    });
  }
}
