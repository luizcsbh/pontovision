import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { WorkSchedule, WorkScheduleDocument } from '../work-schedules/schemas/work-schedule.schema';
import { RegisterDto, LoginDto, UpdatePasswordDto } from './dto/auth.dto';
import { UserRole, isValidCPF, normalizeCPF, maskCPF } from '@pontovision/shared';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(WorkSchedule.name) private readonly workScheduleModel: Model<WorkScheduleDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }

    if (!dto.cpf || !isValidCPF(dto.cpf)) {
      throw new BadRequestException('CPF é obrigatório e deve ser válido.');
    }
    const cleanCpf = normalizeCPF(dto.cpf);

    const existingCpf = await this.userModel.findOne({ cpf: cleanCpf });
    if (existingCpf) {
      throw new ConflictException('Já existe um usuário cadastrado com este CPF.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.userModel.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      cpf: cleanCpf,
      role: UserRole.USER,
      preferences: {
        theme: 'system',
        notifyDiscrepancies: true,
        defaultBreakDurationMinutes: 60,
      },
    });

    // Cria jornada de trabalho padrão (Seg-Sex 8h, Sáb-Dom folga)
    await this.workScheduleModel.create({
      userId: user._id,
      name: 'Jornada Padrão CLT 44h',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      toleranceMinutes: 10,
      isDefault: true,
      weeklyRules: [
        { dayOfWeek: 0, isEnabled: false, expectedWorkMinutes: 0 }, // Domingo
        { dayOfWeek: 1, isEnabled: true, expectedWorkMinutes: 480, plannedEntry: '08:00', plannedBreakStart: '12:00', plannedBreakEnd: '13:00', plannedExit: '17:00' },
        { dayOfWeek: 2, isEnabled: true, expectedWorkMinutes: 480, plannedEntry: '08:00', plannedBreakStart: '12:00', plannedBreakEnd: '13:00', plannedExit: '17:00' },
        { dayOfWeek: 3, isEnabled: true, expectedWorkMinutes: 480, plannedEntry: '08:00', plannedBreakStart: '12:00', plannedBreakEnd: '13:00', plannedExit: '17:00' },
        { dayOfWeek: 4, isEnabled: true, expectedWorkMinutes: 480, plannedEntry: '08:00', plannedBreakStart: '12:00', plannedBreakEnd: '13:00', plannedExit: '17:00' },
        { dayOfWeek: 5, isEnabled: true, expectedWorkMinutes: 480, plannedEntry: '08:00', plannedBreakStart: '12:00', plannedBreakEnd: '13:00', plannedExit: '17:00' },
        { dayOfWeek: 6, isEnabled: false, expectedWorkMinutes: 0 }, // Sábado
      ],
    });

    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase().trim() });
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const tokens = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return this.sanitizeUser(user);
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Senha atual incorreta.');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    await user.save();

    return { message: 'Senha alterada com sucesso.' };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_refresh_secret',
      });
      const user = await this.userModel.findById(new Types.ObjectId(payload.sub));
      if (!user) throw new UnauthorizedException('Usuário não encontrado.');

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token expirado ou inválido.');
    }
  }

  private generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default_refresh_secret',
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: UserDocument) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      cpfMasked: maskCPF(user.cpf),
      company: user.company || {},
      role: user.role,
      timezone: user.timezone,
      preferences: user.preferences,
      createdAt: (user as any).createdAt,
    };
  }
}
