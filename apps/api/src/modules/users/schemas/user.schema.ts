import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '@pontovision/shared';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ trim: true })
  cpf?: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: 'America/Sao_Paulo' })
  timezone: string;

  @Prop({ type: Object, default: {} })
  company?: {
    razaoSocial?: string;
    cnpj?: string;
    endereco?: string;
    cidade?: string;
    uf?: string;
  };

  @Prop({ type: Object, default: {} })
  preferences: {
    theme?: string;
    notifyDiscrepancies?: boolean;
    defaultBreakDurationMinutes?: number;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
