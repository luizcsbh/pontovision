import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { maskCPF, formatCPF, isValidCNPJ, normalizeCNPJ, formatCNPJ, isValidCPF, normalizeCPF } from '@pontovision/shared';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string) {
    const user = await this.userModel.findById(new Types.ObjectId(id));
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      cpf: user.cpf ? formatCPF(user.cpf) : undefined,
      cpfRaw: user.cpf,
      cpfMasked: maskCPF(user.cpf),
      role: user.role,
      timezone: user.timezone,
      company: user.company || {
        razaoSocial: '',
        cnpj: '',
        endereco: '',
        cidade: '',
        uf: '',
      },
      preferences: user.preferences,
      createdAt: (user as any).createdAt,
    };
  }

  async updateProfile(
    id: string,
    data: {
      name?: string;
      cpf?: string;
      company?: {
        razaoSocial?: string;
        cnpj?: string;
        endereco?: string;
        cidade?: string;
        uf?: string;
      };
      preferences?: any;
    },
  ) {
    const user = await this.userModel.findById(new Types.ObjectId(id));
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // 1. Nome pode ser alterado
    if (data.name && data.name.trim()) {
      user.name = data.name.trim();
    }

    // 2. CPF NÃO pode ser alterado se o usuário já possui um registrado
    if (user.cpf) {
      if (data.cpf && normalizeCPF(data.cpf) !== normalizeCPF(user.cpf)) {
        throw new BadRequestException('O CPF é um dado oficial protegido e não pode ser alterado após o cadastro.');
      }
    } else if (data.cpf) {
      // Usuário legado sem CPF: permite cadastrar pela primeira vez com validação estrita
      if (!isValidCPF(data.cpf)) {
        throw new BadRequestException('CPF informado é inválido.');
      }
      user.cpf = normalizeCPF(data.cpf);
    }

    // 3. Dados do local de trabalho / empresa
    if (data.company) {
      const company = { ...(user.company || {}), ...data.company };

      if (company.cnpj && company.cnpj.trim()) {
        const cleanCnpj = normalizeCNPJ(company.cnpj);
        if (!isValidCNPJ(cleanCnpj)) {
          throw new BadRequestException('CNPJ informado para a empresa é inválido.');
        }
        company.cnpj = formatCNPJ(cleanCnpj);
      }

      if (company.razaoSocial) company.razaoSocial = company.razaoSocial.trim();
      if (company.endereco) company.endereco = company.endereco.trim();
      if (company.cidade) company.cidade = company.cidade.trim();
      if (company.uf) company.uf = company.uf.trim().toUpperCase().slice(0, 2);

      user.company = company;
    }

    // 4. Preferências
    if (data.preferences) {
      user.preferences = { ...user.preferences, ...data.preferences };
    }

    await user.save();
    return this.findById(id);
  }

  async updatePreferences(id: string, preferences: any) {
    const user = await this.userModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: { preferences } },
      { new: true },
    );
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user.preferences;
  }
}
