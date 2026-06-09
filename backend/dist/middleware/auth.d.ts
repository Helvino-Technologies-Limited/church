import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserRole } from '@prisma/client';
export declare const authenticate: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const requireSuperAdmin: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const requireTenantAdmin: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const requireAuth: (roles?: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map