import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TimeEntryType, TimeEntrySource, TimeEntryStatus } from '@pontovision/shared';

export type TimeEntryDocument = TimeEntry & Document;

@Schema({ timestamps: true })
export class TimeEntry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true }) // Formato YYYY-MM-DD
  workDate: string;

  @Prop({ required: true }) // Formato HH:mm
  time: string;

  @Prop({ required: true, enum: TimeEntryType })
  type: TimeEntryType;

  @Prop({ required: true, enum: TimeEntrySource, default: TimeEntrySource.MANUAL })
  source: TimeEntrySource;

  @Prop({ required: true, enum: TimeEntryStatus, default: TimeEntryStatus.ACTIVE })
  status: TimeEntryStatus;

  @Prop({ type: Types.ObjectId, ref: 'TimeDocument', default: null })
  documentId?: Types.ObjectId;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Object, default: null })
  originalOcrData?: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const TimeEntrySchema = SchemaFactory.createForClass(TimeEntry);
TimeEntrySchema.index({ userId: 1, workDate: 1, time: 1 });
