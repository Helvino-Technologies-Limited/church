import { Request } from 'express';
import { UserRole } from '@prisma/client';
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
    impersonating?: boolean;
    originalUserId?: string;
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
    tenantId?: string;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface PaginationQuery {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
//# sourceMappingURL=index.d.ts.map