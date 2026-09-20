import { IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTeacherAssignmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsISO8601()
  dueDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  subject?: string;
}
