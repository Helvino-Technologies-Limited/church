import { Request } from 'express';
export declare const createAuditLog: (params: {
    tenantId?: string | null;
    userId?: string | null;
    userEmail?: string | null;
    action: string;
    entity?: string;
    entityId?: string;
    details?: Record<string, unknown>;
    req?: Request;
}) => Promise<void>;
//# sourceMappingURL=audit.d.ts.map