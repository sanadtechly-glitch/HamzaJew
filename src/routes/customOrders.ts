import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// POST /custom-orders - Submit custom design request (allows image upload)
router.post(
  '/',
  upload.single('image'),
  async (req: any, res: Response) => {
    try {
      const { customerName, phone, branchId, itemType, description, budget } = req.body;

      if (!customerName || !phone || !branchId || !itemType || !description) {
        return res.status(400).json({ error: 'الرجاء ملء جميع البيانات الأساسية لطلب التصميم الخاص' });
      }

      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) {
        return res.status(404).json({ error: 'الفرع المحدد غير موجود' });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const customOrder = await prisma.customOrder.create({
        data: {
          customerName,
          phone,
          branchId,
          itemType,
          description,
          budget: budget ? parseFloat(budget) : null,
          imageUrl,
          status: 'NEW',
        },
        include: {
          branch: true,
        },
      });

      res.status(201).json(customOrder);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء إرسال طلب التصميم الخاص: ' + error.message });
    }
  }
);

// GET /custom-orders/by-phone/:phone - Public route to fetch custom orders by customer phone number
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ error: 'الرجاء توفير رقم الهاتف' });
    }

    const orders = await prisma.customOrder.findMany({
      where: { phone },
      include: {
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب طلبات التصميم الخاص: ' + error.message });
  }
});


// GET /admin/custom-orders - Admin dashboard view
router.get(
  '/admin',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ORDERS_MANAGER']),
  async (req, res) => {
    try {
      const { branchId, status } = req.query;

      const where: any = {};
      if (branchId) where.branchId = branchId as string;
      if (status) where.status = status as string;

      const orders = await prisma.customOrder.findMany({
        where,
        include: {
          branch: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء جلب طلبات التصميم الخاص: ' + error.message });
    }
  }
);

// PUT /admin/custom-orders/:id/status - Update order status & notes
router.put(
  '/admin/:id/status',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ORDERS_MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const order = await prisma.customOrder.findUnique({ where: { id } });
      if (!order) {
        return res.status(404).json({ error: 'طلب التصميم غير موجود' });
      }

      const updated = await prisma.customOrder.update({
        where: { id },
        data: {
          status: status !== undefined ? status : order.status,
          adminNotes: adminNotes !== undefined ? adminNotes : order.adminNotes,
        },
        include: {
          branch: true,
        },
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء تحديث حالة طلب التصميم: ' + error.message });
    }
  }
);

export default router;
