import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Obtém detalhes do usuário logado' })
  @Get('me')
  async getMe(@Request() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @ApiOperation({ summary: 'Atualiza preferências do usuário' })
  @Patch('preferences')
  async updatePreferences(@Request() req: any, @Body() body: any) {
    return this.usersService.updatePreferences(req.user.userId, body);
  }
}
