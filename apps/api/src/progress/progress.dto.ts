import { IsArray, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ErrorSkillDto {
  @IsString() @MaxLength(120) skill!: string;
  @IsInt() @Min(1) @Max(20) misses!: number;
}

export class RecordGameAttemptDto {
  @IsString() @MaxLength(80) mode!: string;
  @IsOptional() @IsString() @MaxLength(80) subject?: string;
  @IsInt() @Min(0) score!: number;
  @IsInt() @Min(1) total!: number;
  @IsOptional() @IsInt() @Min(0) @Max(3600000) durationMs?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ErrorSkillDto) errorSkills?: ErrorSkillDto[];
  @IsOptional() @IsString() @MaxLength(120) clientEventId?: string;
  @IsOptional() @IsString() @MaxLength(120) gameSessionId?: string;
}
