import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

const donationSchema = z.object({
  memberId: z.string().uuid().optional().or(z.literal('')),
  memberName: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('KES'),
  paymentMethod: z.enum(['CASH', 'MPESA', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER']).default('CASH'),
  category: z.string().optional(),
  fundCategoryId: z.string().uuid().optional().or(z.literal('')),
  description: z.string().optional(),
  receiptNo: z.string().optional(),
  donatedAt: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (search) where.OR = [{ memberName: { contains: search, mode: 'insensitive' } }, { receiptNo: { contains: search } }];
    if (category) where.category = category;

    if ((req.query.category as string)) where.category = req.query.category;

    const [donations, total, totals] = await Promise.all([
      prisma.donation.findMany({
        where, skip, take: limit, orderBy: { donatedAt: 'desc' },
        include: { fundCategory: { select: { id: true, name: true, color: true } } },
      }),
      prisma.donation.count({ where }),
      prisma.donation.aggregate({ where, _sum: { amount: true } }),
    ]);

    res.json({
      success: true,
      data: donations,
      summary: { totalAmount: totals._sum.amount || 0 },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const data = donationSchema.parse(req.body);

    const donation = await prisma.donation.create({
      data: {
        tenantId,
        memberId: data.memberId || null,
        memberName: data.memberName,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        category: data.category,
        fundCategoryId: data.fundCategoryId || null,
        description: data.description,
        receiptNo: data.receiptNo || `RCP-${Date.now().toString(36).toUpperCase()}`,
        donatedAt: data.donatedAt ? new Date(data.donatedAt) : new Date(),
      },
      include: { fundCategory: { select: { id: true, name: true, color: true } } },
    });

    res.status(201).json({ success: true, data: donation });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const donation = await prisma.donation.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!donation) throw new AppError('Donation not found', 404);
    await prisma.donation.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Donation deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
