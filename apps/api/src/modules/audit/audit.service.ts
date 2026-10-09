import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { AuditAction } from '@pontovision/shared';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async logAction(params: {
    userId: string;
    actorId: string;
    entityType: string;
    entityId: string;
    action: AuditAction;
    changedFields?: Record<string, { before: any; after: any }>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.auditModel.create({
        userId: new Types.ObjectId(params.userId),
        actorId: new Types.ObjectId(params.actorId),
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        changedFields: params.changedFields,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (err: any) {
      this.logger.error(`Erro ao gravar log de auditoria: ${err.message}`);
    }
  }

  async findByEntity(entityType: string, entityId: string, userId: string) {
    return this.auditModel
      .find({
        userId: new Types.ObjectId(userId),
        entityType,
        entityId,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUser(userId: string, limit = 50) {
    return this.auditModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
