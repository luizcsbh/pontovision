import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuditAction } from '@pontovision/shared';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actorId: Types.ObjectId;

  @Prop({ required: true, index: true })
  entityType: string;

  @Prop({ required: true, index: true })
  entityId: string;

  @Prop({ required: true, enum: AuditAction })
  action: AuditAction;

  @Prop({ type: Object })
  changedFields?: Record<string, { before: any; after: any }>;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ userId: 1, createdAt: -1 });
