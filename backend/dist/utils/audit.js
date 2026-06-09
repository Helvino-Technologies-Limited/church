"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = void 0;
const database_1 = __importDefault(require("../config/database"));
const createAuditLog = async (params) => {
    try {
        await database_1.default.auditLog.create({
            data: {
                tenantId: params.tenantId || null,
                userId: params.userId || null,
                userEmail: params.userEmail || null,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                details: params.details,
                ipAddress: params.req?.ip,
                userAgent: params.req?.headers['user-agent'],
            },
        });
    }
    catch {
        // Non-fatal: audit logging should not break main flow
    }
};
exports.createAuditLog = createAuditLog;
//# sourceMappingURL=audit.js.map