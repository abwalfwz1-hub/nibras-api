import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantTransactionService } from '../src/common/tenant-transaction/tenant-transaction.service';

describe('TenantTransactionService — Connection Pool Isolation', () => {
  let prisma: PrismaService;
  let tenantTx: TenantTransactionService;

  const alpha = '11111111-1111-1111-1111-111111111111';
  const beta = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, TenantTransactionService],
    }).compile();

    prisma = module.get(PrismaService);
    tenantTx = module.get(TenantTransactionService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('isolates interleaved parallel tenant transactions', async () => {
    const tasks = Array.from({ length: 50 }, (_, i) => {
      const tenant = i % 2 === 0 ? alpha : beta;
      return tenantTx.executeInTenantContext(tenant, async (tx) => {
        const rows = await tx.$queryRaw<Array<{ school_id: string }>>`
          SELECT school_id FROM student_attendance LIMIT 5
        `;
        expect(rows.every((r: { school_id: string }) => r.school_id === tenant)).toBe(true);
      });
    });

    await Promise.all(tasks);
  });

  it('does not retain tenant state after transaction', async () => {
    await tenantTx.executeInTenantContext(alpha, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ value: string }>>`
        SELECT current_setting('app.current_school_id', true) AS value
      `;
      expect(rows[0].value).toBe(alpha);
    });

    const rows = await prisma.$queryRaw<Array<{ value: string }>>`
      SELECT current_setting('app.current_school_id', true) AS value
    `;
    expect(rows[0].value).toBe('');
  });
});
