import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

const assetSchema = z.object({
  assetName: z.string().min(2),
  assetCode: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  assetValue: z.number().optional(),
  location: z.string().optional(),
  status: z.string().default('ACTIVE'),
  condition: z.string().optional(),
  purchasedAt: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (search) where.OR = [{ assetName: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } }];

    const [assets, total, totalValue] = await Promise.all([
      prisma.asset.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.asset.count({ where }),
      prisma.asset.aggregate({ where, _sum: { assetValue: true } }),
    ]);

    res.json({
      success: true,
      data: assets,
      summary: { totalValue: totalValue._sum.assetValue || 0 },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const data = assetSchema.parse(req.body);

    const count = await prisma.asset.count({ where: { tenantId } });
    const assetCode = data.assetCode || `AST-${String(count + 1).padStart(4, '0')}`;

    const asset = await prisma.asset.create({
      data: { tenantId, ...data, assetCode, purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : null },
    });

    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.asset.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!existing) throw new AppError('Asset not found', 404);

    const data = assetSchema.partial().parse(req.body);
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: { ...data, purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : undefined },
    });

    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const asset = await prisma.asset.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!asset) throw new AppError('Asset not found', 404);
    await prisma.asset.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Asset deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
