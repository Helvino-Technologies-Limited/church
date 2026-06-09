import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

const parishSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parishes = await prisma.parish.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: true } } },
    });
    res.json({ success: true, data: parishes });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = parishSchema.parse(req.body);
    const parish = await prisma.parish.create({ data: { tenantId: req.tenantId!, ...data, email: data.email || null } });
    res.status(201).json({ success: true, data: parish });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.parish.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!existing) throw new AppError('Parish not found', 404);
    const data = parishSchema.partial().parse(req.body);
    const parish = await prisma.parish.update({ where: { id: req.params.id }, data: { ...data, email: data.email || null } });
    res.json({ success: true, data: parish });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parish = await prisma.parish.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!parish) throw new AppError('Parish not found', 404);
    await prisma.parish.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Parish deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
