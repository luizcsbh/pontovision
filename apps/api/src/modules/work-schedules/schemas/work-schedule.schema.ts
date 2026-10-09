import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IDayScheduleRule } from '@pontovision/shared';

export type WorkScheduleDocument = WorkSchedule & Document;

@Schema({ timestamps: true })
export class WorkSchedule {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Array, required: true })
  weeklyRules: IDayScheduleRule[];

  @Prop({ required: true }) // YYYY-MM-DD
  effectiveFrom: string;

  @Prop() // YYYY-MM-DD
  effectiveUntil?: string;

  @Prop({ default: 10 })
  toleranceMinutes: number;

  @Prop({ default: true })
  isDefault: boolean;
}

export const WorkScheduleSchema = SchemaFactory.createForClass(WorkSchedule);
WorkScheduleSchema.index({ userId: 1, isDefault: 1 });
