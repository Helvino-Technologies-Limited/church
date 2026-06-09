import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const schema = z.object({
  date: z.string(),
  serviceType: z.string().optional(),
  adults: z.number().int().min(0).default(0),
  children: z.number().int().min(0).default(0),
  visitors: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  parishId: z.string().uuid().optional().or(z.literal('')),
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [records, total, totals] = await Promise.all([
      prisma.attendance.findMany({
        where: { tenantId },
        skip, take: limit,
        orderBy: { date: 'desc' },
        include: { parish: { select: { id: true, name: true } } },
      }),
      prisma.attendance.count({ where: { tenantId } }),
      prisma.attendance.aggregate({ where: { tenantId }, _sum: { adults: true, children: true, visitors: true, total: true }, _avg: { total: true } }),
    ]);

    res.json({ success: true, data: records, summary: totals._sum, avgAttendance: Math.round(totals._avg.total || 0), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const data = schema.parse(req.body);
    const total = data.adults + data.children + data.visitors;
    const record = await prisma.attendance.create({
      data: {
        tenantId,
        date: new Date(data.date),
        serviceType: data.serviceType,
        adults: data.adults, children: data.children,
        visitors: data.visitors, total,
        notes: data.notes,
        parishId: data.parishId || null,
      },
    });
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.attendance.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!existing) throw new AppError('Record not found', 404);
    const data = schema.partial().parse(req.body);
    const total = (data.adults ?? existing.adults) + (data.children ?? existing.children) + (data.visitors ?? existing.visitors);
    const record = await prisma.attendance.update({
      where: { id: req.params.id },
      data: { ...data, total, date: data.date ? new Date(data.date) : undefined, parishId: data.parishId || null },
    });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.attendance.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!existing) throw new AppError('Record not found', 404);
    await prisma.attendance.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) { next(err); }
});

export default router;
