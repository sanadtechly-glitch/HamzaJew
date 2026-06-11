import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET /branches - Public list
router.get('/', async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
    });
    res.json(branches);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الفروع: ' + error.message });
  }
});

// GET /admin/branches - Admin complete list
router.get('/admin', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const branches = await prisma.branch.findMany();
    res.json(branches);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الفروع للإدارة: ' + error.message });
  }
});

// POST /admin/branches - Create branch
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { name, address, phone, whatsapp, workingHours, mapUrl, isActive } = req.body;

    if (!name || !address || !phone || !whatsapp || !workingHours) {
      return res.status(400).json({ error: 'الرجاء إدخال كافة حقول الفرع المطلوبة' });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        phone,
        whatsapp,
        workingHours,
        mapUrl: mapUrl || null,
        isActive: isActive === undefined ? true : (isActive === true || isActive === 'true'),
      },
    });

    res.status(201).json(branch);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الفرع: ' + error.message });
  }
});

// PUT /admin/branches/:id - Update branch
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, whatsapp, workingHours, mapUrl, isActive } = req.body;

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'الفرع غير موجود' });
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        address: address !== undefined ? address : existing.address,
        phone: phone !== undefined ? phone : existing.phone,
        whatsapp: whatsapp !== undefined ? whatsapp : existing.whatsapp,
        workingHours: workingHours !== undefined ? workingHours : existing.workingHours,
        mapUrl: mapUrl !== undefined ? mapUrl : existing.mapUrl,
        isActive: isActive !== undefined ? (isActive === true || isActive === 'true') : existing.isActive,
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث بيانات الفرع: ' + error.message });
  }
});

// DELETE /admin/branches/:id - Delete branch
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'الفرع غير موجود' });
    }

    await prisma.branch.delete({ where: { id } });
    res.json({ message: 'تم حذف الفرع بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الفرع: ' + error.message });
  }
});

export default router;
