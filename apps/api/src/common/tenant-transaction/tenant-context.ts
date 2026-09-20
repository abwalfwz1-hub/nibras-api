import { BadRequestException } from '@nestjs/common';

export const TENANT_HEADER = 'x-school-id';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** The header is only a membership selector; authorization must validate it before use. */
export function requireTenantId(value: unknown): string {
  if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
    throw new BadRequestException('INVALID_TENANT_SCOPE');
  }
  return value;
}
