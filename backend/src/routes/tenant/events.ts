import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  allDay: z.boolean().default(false),
  category: z.string().optional(),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('UPCOMING'),
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;

    const [events, total] = await Promise.all([
      prisma.event.findMany({ where, skip, take: limit, orderBy: { startDate: 'desc' } }),
      prisma.event.count({ where }),
    ]);

    res.json({ success: true, data: events, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = schema.parse(req.body);
    const event = await prisma.event.create({
      data: {
        tenantId: req.tenantId!,
        title: data.title, description: data.description, location: data.location,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        allDay: data.allDay, category: data.category, status: data.status,
      },
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.event.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!existing) throw new AppError('Event not found', 404);
    const data = schema.partial().parse(req.body);
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : null },
    });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.event.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!event) throw new AppError('Event not found', 404);
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
});

export default router;
