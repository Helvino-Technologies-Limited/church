import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

const employeeSchema = z.object({
  fullname: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  salary: z.number().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

async function nextEmployeeNo(tenantId: string): Promise<string> {
  const last = await prisma.employee.findFirst({ where: { tenantId }, orderBy: { employeeNo: 'desc' }, select: { employeeNo: true } });
  const num = last ? parseInt(last.employeeNo.replace(/\D/g, '')) + 1 : 1;
  return `EMP-${String(num).padStart(4, '0')}`;
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (search) where.OR = [
      { fullname: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
    ];

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.employee.count({ where }),
    ]);

    res.json({ success: true, data: employees, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId!;
    const data = employeeSchema.parse(req.body);
    const employeeNo = await nextEmployeeNo(tenantId);

    const employee = await prisma.employee.create({
      data: {
        tenantId,
        employeeNo,
        fullname: data.fullname,
        email: data.email || null,
        phone: data.phone,
        department: data.department,
        position: data.position,
        salary: data.salary,
        startDate: data.startDate ? new Date(data.startDate) : null,
        notes: data.notes,
      },
    });

    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.employee.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!existing) throw new AppError('Employee not found', 404);

    const data = employeeSchema.partial().parse(req.body);
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: { ...data, email: data.email || null, startDate: data.startDate ? new Date(data.startDate) : undefined },
    });

    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employee = await prisma.employee.findFirst({ where: { id: req.params.id, tenantId: req.tenantId! } });
    if (!employee) throw new AppError('Employee not found', 404);
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
