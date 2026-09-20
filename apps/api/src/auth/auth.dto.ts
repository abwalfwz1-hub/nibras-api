import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @MinLength(2) fullName!: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(1) password!: string;
  @IsOptional() @IsUUID() schoolId?: string;
}

export class RefreshDto {
  @IsString() @MinLength(20) refreshToken!: string;
}
