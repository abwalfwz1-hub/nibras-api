import { BadRequestException } from '@nestjs/common';
import { TenantTransactionService } from '../common/tenant-transaction/tenant-transaction.service';

describe('security boundaries', () => {
  it('rejects malformed tenant identifiers before opening a transaction', async () => {
    const prisma = { $transaction: jest.fn() } as any;
    const service = new TenantTransactionService(prisma);
    await expect(service.executeInTenantContext('not-a-uuid', async () => null)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
