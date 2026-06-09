import prisma from '../config/database';
import { Request } from 'express';

export const createAuditLog = async (params: {
  tenantId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  req?: Request;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId || null,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details as any,
        ipAddress: params.req?.ip,
        userAgent: params.req?.headers['user-agent'],
      },
    });
  } catch {
    // Non-fatal: audit logging should not break main flow
  }
};
