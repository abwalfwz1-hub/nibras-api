import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ReviewStatus } from '@prisma/client';
export class ReviewContentDto { @IsString() @MaxLength(180) contentKey!: string; @IsEnum(ReviewStatus) status!: ReviewStatus; @IsOptional() @IsBoolean() subjectAccuracy?: boolean; @IsOptional() @IsBoolean() languageQuality?: boolean; @IsOptional() @IsBoolean() accessibilitySafety?: boolean; @IsOptional() @IsBoolean() sourceRights?: boolean; @IsOptional() @IsString() @MaxLength(4000) comment?: string; @IsOptional() @IsUUID() schoolId?: string; }
