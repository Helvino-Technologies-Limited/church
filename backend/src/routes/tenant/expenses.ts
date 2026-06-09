import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const schema = z.object({
  description: z.string().min(2),
  amount: z.number().positive(),
  currency: z.string().default('KES'),
  category: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'MPESA', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER']).default('CASH'),
  paidTo: z.string().optional(),
  approvedBy: z.string().optional(),
  receiptNo: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

async function nextExpenseNo(tenantId: string): Promise<string> {
  const count = await prisma.expense.count({ where: { tenantId } });
  return `EXP-${String(count + 1).padStart(5, '0')}`;
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (search) where.OR = [{ description: { contains: search, mode: 'insensitive' } }, { paidTo: { contains: search, mode: 'insensitive' } }];
    if (category) where.category = category;

    const [expenses, total, totals] = await Promise.all([
      prisma.expense.findMany({ where, skip, take: limit, orderBy: { paidAt: 'desc' } }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where: { tenantId }, _sum: { amount: true } }),
    ]);

    res.json({
      success: true,
      data: expenses,
      summary: { totalAmount: totals._sum.amount || 0 },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const data = schema.parse(req.body);
    const expenseNo = await nextExpenseNo(tenantId);
    const expense = await prisma.expense.create({
      data: {
        tenantId, expenseNo,
        description: data.description,
        amount: data.amount, currency: data.currency,
        category: data.category, paymentMethod: data.paymentMethod,
        paidTo: data.paidTo, approvedBy: data.approvedBy,
        receiptNo: data.receiptNo || `RCP-${Date.now().toString(36).toUpperCase()}`,
        notes: data.notes,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      },
    });
    res.status(201).json({ success: true, data: expense });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!existing) throw new AppError('Expense not found', 404);
    const data = schema.partial().parse(req.body);
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: { ...data, paidAt: data.paidAt ? new Date(data.paidAt) : undefined },
    });
    res.json({ success: true, data: expense });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expense = await prisma.expense.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!expense) throw new AppError('Expense not found', 404);
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) { next(err); }
});

export default router;
