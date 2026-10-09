import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  name: string;

  @ApiProperty({ example: 'joao@exemplo.com' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'E-mail é obrigatório.' })
  email: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A senha deve conter no mínimo 8 caracteres.' })
  password: string;

  @ApiProperty({ example: '52998224725', required: true })
  @IsString({ message: 'CPF deve ser texto.' })
  @IsNotEmpty({ message: 'CPF é obrigatório para criação de conta.' })
  cpf: string;
}

export class LoginDto {
  @ApiProperty({ example: 'joao@exemplo.com' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'E-mail é obrigatório.' })
  email: string;

  @ApiProperty({ example: 'SenhaForte@123' })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória.' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class UpdatePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
