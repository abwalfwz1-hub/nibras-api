import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './auth.dto';
import { JwtAuthGuard } from './auth.guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register') register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Post('refresh') refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto.refreshToken); }

  @UseGuards(JwtAuthGuard)
  @Get('me') me(@Req() req: any) { return req.user; }
}
