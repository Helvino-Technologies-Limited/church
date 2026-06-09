import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/tenant/fund-categories
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const categories = await prisma.fundCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { donations: true } },
        donations: { select: { amount: true } },
      },
    });

    const result = categories.map((c) => ({
      ...c,
      donationCount: c._count.donations,
      totalRaised: c.donations.reduce((sum, d) => sum + Number(d.amount), 0),
      donations: undefined,
      _count: undefined,
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/tenant/fund-categories
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const data = categorySchema.parse(req.body);
    const category = await prisma.fundCategory.create({
      data: { tenantId, ...data },
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
});

// PUT /api/tenant/fund-categories/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.fundCategory.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Fund category not found', 404);
    const data = categorySchema.partial().parse(req.body);
    const category = await prisma.fundCategory.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
});

// DELETE /api/tenant/fund-categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const existing = await prisma.fundCategory.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) throw new AppError('Fund category not found', 404);
    const inUse = await prisma.donation.count({ where: { fundCategoryId: req.params.id } });
    if (inUse > 0) throw new AppError(`Cannot delete: ${inUse} donation(s) linked to this fund`, 400);
    await prisma.fundCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Fund category deleted' });
  } catch (err) { next(err); }
});

export default router;
