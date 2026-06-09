import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const schema = z.object({
  employeeId: z.string().uuid(),
  period: z.string(),
  basicSalary: z.number().positive(),
  allowances: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'MPESA', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER']).default('BANK_TRANSFER'),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'PAID']).default('PENDING'),
});

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const period = req.query.period as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (period) where.period = { contains: period };

    const [payrolls, total, totals] = await Promise.all([
      prisma.payroll.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { employee: { select: { id: true, fullname: true, employeeNo: true, department: true, position: true } } },
      }),
      prisma.payroll.count({ where }),
      prisma.payroll.aggregate({ where: { tenantId }, _sum: { netPay: true, basicSalary: true, allowances: true, deductions: true } }),
    ]);

    res.json({ success: true, data: payrolls, summary: totals._sum, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const data = schema.parse(req.body);
    const netPay = data.basicSalary + data.allowances - data.deductions;

    const employee = await prisma.employee.findFirst({ where: { id: data.employeeId, tenantId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const payroll = await prisma.payroll.create({
      data: { tenantId, employeeId: data.employeeId, period: data.period, basicSalary: data.basicSalary, allowances: data.allowances, deductions: data.deductions, netPay, paymentMethod: data.paymentMethod, notes: data.notes, status: data.status },
      include: { employee: { select: { id: true, fullname: true, employeeNo: true } } },
    });

    res.status(201).json({ success: true, data: payroll });
  } catch (err) { next(err); }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const existing = await prisma.payroll.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!existing) throw new AppError('Payroll record not found', 404);
    const updated = await prisma.payroll.update({ where: { id: req.params.id }, data: { status, paidAt: status === 'PAID' ? new Date() : null } });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.payroll.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!existing) throw new AppError('Record not found', 404);
    await prisma.payroll.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Payroll record deleted' });
  } catch (err) { next(err); }
});

export default router;
