import { Type } from 'class-transformer';
import { IsArray, IsISO8601, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class SyncEventDto {
  @IsUUID()
  id!: string;
  @IsString()
  @MaxLength(80)
  type!: string;
  @IsObject()
  payload!: Record<string, unknown>;
  @IsISO8601()
  createdAt!: string;
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceId?: string;
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  sequenceNumber?: number;
}

export class SyncEventsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncEventDto)
  events!: SyncEventDto[];
}
