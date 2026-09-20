import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { GlobalRole, SchoolRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { LoginDto, RegisterDto } from './auth.dto';

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  globalRole: GlobalRole;
  schoolId?: string;
}

type RefreshPayload = { sub: string; jti: string; familyId: string; type: 'refresh' };

@Injectable()
export class AuthService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me';
  private readonly accessTtl = process.env.ACCESS_TOKEN_TTL ?? '15m';

  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('EMAIL_ALREADY_REGISTERED');
    const user = await this.prisma.user.create({
      data: { email, fullName: dto.fullName.trim(), passwordHash: await bcrypt.hash(dto.password, 12) },
    });
    return this.issueSession({ userId: user.id, email: user.email, fullName: user.fullName, globalRole: user.globalRole });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() }, include: { memberships: true } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('INVALID_CREDENTIALS');
    const membership = dto.schoolId
      ? user.memberships.find((m) => m.schoolId === dto.schoolId && m.isActive)
      : user.memberships.find((m) => m.isActive);
    if (dto.schoolId && !membership) throw new UnauthorizedException('NO_ACTIVE_MEMBERSHIP');
    return this.issueSession({ userId: user.id, email: user.email, fullName: user.fullName, globalRole: user.globalRole, schoolId: membership?.schoolId });
  }

  async refresh(rawToken: string) {
    let payload: RefreshPayload;
    try { payload = jwt.verify(rawToken, this.refreshSecret) as RefreshPayload; }
    catch { throw new UnauthorizedException('INVALID_REFRESH_TOKEN'); }
    if (payload.type !== 'refresh') throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash: this.hash(rawToken) }, include: { user: { include: { memberships: true } } } });
    if (!record || record.revokedAt || record.expiresAt <= new Date()) throw new UnauthorizedException('REFRESH_TOKEN_REVOKED');
    if (record.usedAt) {
      await this.prisma.refreshToken.updateMany({ where: { familyId: record.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException('REFRESH_TOKEN_REUSE_DETECTED');
    }
    await this.prisma.refreshToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    const membership = record.user.memberships.find((m) => m.isActive);
    return this.issueSession({ userId: record.user.id, email: record.user.email, fullName: record.user.fullName, globalRole: record.user.globalRole, schoolId: membership?.schoolId }, record.familyId as `${string}-${string}-${string}-${string}-${string}`);
  }

  async verifyAccessToken(rawToken: string): Promise<AuthUser> {
    try {
      const payload = jwt.verify(rawToken, this.accessSecret) as AuthUser & { type: string };
      if (payload.type !== 'access') throw new Error('wrong token type');
      return payload;
    } catch { throw new UnauthorizedException('INVALID_ACCESS_TOKEN'); }
  }

  async getActiveMembership(userId: string, schoolId?: string) {
    if (!schoolId) return undefined;
    return this.prisma.schoolMembership.findFirst({ where: { userId, schoolId, isActive: true } });
  }

  private async issueSession(user: AuthUser, familyId = randomUUID()) {
    const accessToken = jwt.sign({ ...user, type: 'access' }, this.accessSecret, { expiresIn: this.accessTtl as jwt.SignOptions['expiresIn'] });
    const jti = randomUUID();
    const refreshToken = jwt.sign({ sub: user.userId, jti, familyId, type: 'refresh' }, this.refreshSecret, { expiresIn: '30d' });
    await this.prisma.refreshToken.create({ data: { userId: user.userId, tokenHash: this.hash(refreshToken), familyId, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    return { accessToken, refreshToken, user };
  }

  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
}
