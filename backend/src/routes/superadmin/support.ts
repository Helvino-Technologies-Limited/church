import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

// GET /superadmin/support — list all tickets
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { tenant: { select: { id: true, name: true, email: true } } },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({ success: true, data: tickets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// POST /superadmin/support/:id/reply
router.post('/:id/reply', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    if (!message) throw new AppError('Message is required', 400);

    const ticket = await prisma.supportTicket.findFirst({ where: { id: req.params.id } });
    if (!ticket) throw new AppError('Ticket not found', 404);

    const updated = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { response: message, status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// PATCH /superadmin/support/:id/status
router.patch('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const updated = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : undefined },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// Tenant-facing: POST to submit a support ticket
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
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
