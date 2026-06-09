import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';

const router = Router();

// GET /api/tenant/notifications — last 15 audit log entries for the tenant
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        action: true,
        entity: true,
        details: true,
        userEmail: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
