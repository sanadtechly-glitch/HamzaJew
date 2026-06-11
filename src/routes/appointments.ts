import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// POST /appointments - Public submission
router.post('/', async (req, res) => {
  try {
    const { customerName, phone, branchId, date, time, reason, notes } = req.body;

    if (!customerName || !phone || !branchId || !date || !time || !reason) {
      return res.status(400).json({ error: 'الرجاء ملء جميع البيانات الإلزامية لحجز الموعد' });
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return res.status(404).json({ error: 'الفرع المحدد غير موجود' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerName,
        phone,
        branchId,
        date,
        time,
        reason,
        notes: notes || null,
        status: 'NEW',
      },
      include: {
        branch: true,
      },
    });

    res.status(201).json(appointment);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء حجز الموعد: ' + error.message });
  }
});

// GET /appointments/by-phone/:phone - Public route to fetch appointments by customer phone number
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ error: 'الرجاء توفير رقم الهاتف' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { phone },
      include: {
        branch: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الحجوزات: ' + error.message });
  }
});


// GET /admin/appointments - Admin dashboard view
router.get(
  '/admin',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ORDERS_MANAGER']),
  async (req, res) => {
    try {
      const { branchId, status, date } = req.query;

      const where: any = {};
      if (branchId) where.branchId = branchId as string;
      if (status) where.status = status as string;
      if (date) where.date = date as string;

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          branch: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء جلب الحجوزات: ' + error.message });
    }
  }
);

// PUT /admin/appointments/:id/status - Update booking status
router.put(
  '/admin/:id/status',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ORDERS_MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const appointment = await prisma.appointment.findUnique({ where: { id } });
      if (!appointment) {
        return res.status(404).json({ error: 'الحجز غير موجود' });
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: status !== undefined ? status : appointment.status,
          adminNotes: adminNotes !== undefined ? adminNotes : appointment.adminNotes,
        },
        include: {
          branch: true,
        },
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء تحديث حالة الحجز: ' + error.message });
    }
  }
);

export default router;
