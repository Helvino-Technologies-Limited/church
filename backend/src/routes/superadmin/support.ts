import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

router.get('/tickets', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { tenant: { select: { id: true, name: true } } },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({ success: true, data: tickets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.patch('/tickets/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, response } = req.body;
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status, response, resolvedAt: status === 'RESOLVED' ? new Date() : null },
    });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

// Tenant can submit support tickets
router.post('/tickets', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { subject, message, category, priority } = req.body;
    if (!subject || !message) throw new AppError('Subject and message are required', 400);

    const ticket = await prisma.supportTicket.create({
      data: { tenantId: req.tenantId || null, subject, message, category, priority: priority || 'MEDIUM' },
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

export default router;
