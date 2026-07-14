import { Router, Response } from 'express';
import { prisma } from '@vms/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /employees - Query active host directory
router.get('/', async (req: any, res: Response) => {
  const { search, departmentId } = req.query;

  try {
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        departmentId: departmentId ? (departmentId as string) : undefined,
        OR: search ? [
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ] : undefined
      },
      include: {
        department: true
      },
      orderBy: { fullName: 'asc' }
    });

    const data = employees.map((e: any) => ({
      id: e.id,
      fullName: e.fullName,
      email: e.email,
      phone: e.phone,
      floor: e.floor || '',
      isActive: e.isActive,
      departmentName: e.department.name,
      branchId: e.branchId
    }));

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// GET /employees/departments - Get all departments for search filtering
router.get('/departments', async (req: any, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json({
      success: true,
      data: departments
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// POST /employees - Admin adds a new employee
router.post('/', authenticateToken as any, async (req: any, res: Response) => {
  const { fullName, email, phone, floor, departmentId } = req.body;

  if (!fullName || !email || !phone || !departmentId) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Missing directory fields' } });
  }

  try {
    const branchId = req.user.branchId;
    const employee = await prisma.employee.create({
      data: {
        fullName,
        email,
        phone,
        floor,
        departmentId,
        branchId
      },
      include: { department: true }
    });

    return res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

export default router;
