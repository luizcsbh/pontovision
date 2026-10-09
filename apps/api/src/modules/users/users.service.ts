import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { maskCPF } from '@pontovision/shared';

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
      cpfMasked: maskCPF(user.cpf),
      role: user.role,
      timezone: user.timezone,
      preferences: user.preferences,
      createdAt: (user as any).createdAt,
    };
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
