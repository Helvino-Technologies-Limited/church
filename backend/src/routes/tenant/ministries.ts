import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  leaderId: z.string().uuid().optional().or(z.literal('')),
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ministries = await prisma.ministry.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: true } } },
    });
    res.json({ success: true, data: ministries });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ministry = await prisma.ministry.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
      include: { members: { select: { id: true, fullname: true, memberNo: true, phone: true, status: true } }, _count: { select: { members: true } } },
    });
    if (!ministry) throw new AppError('Ministry not found', 404);
    res.json({ success: true, data: ministry });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = schema.parse(req.body);
    const ministry = await prisma.ministry.create({
      data: { tenantId: req.tenantId!, ...data, leaderId: data.leaderId || null },
    });
    res.status(201).json({ success: true, data: ministry });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.ministry.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!existing) throw new AppError('Ministry not found', 404);
    const data = schema.partial().parse(req.body);
    const ministry = await prisma.ministry.update({ where: { id: req.params.id }, data: { ...data, leaderId: data.leaderId || null } });
    res.json({ success: true, data: ministry });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ministry = await prisma.ministry.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!ministry) throw new AppError('Ministry not found', 404);
    await prisma.ministry.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Ministry deleted' });
  } catch (err) { next(err); }
});

export default router;
