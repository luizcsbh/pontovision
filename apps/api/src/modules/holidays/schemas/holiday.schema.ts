import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { HolidayScope } from '@pontovision/shared';

export type HolidayDocument = Holiday & Document;

@Schema({ timestamps: true })
export class Holiday {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, index: true }) // YYYY-MM-DD
  date: string;

  @Prop({ required: true, enum: HolidayScope, default: HolidayScope.NATIONAL })
  scope: HolidayScope;

  @Prop({ trim: true })
  region?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);
HolidaySchema.index({ date: 1, scope: 1 });
