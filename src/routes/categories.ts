import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// GET /categories - Public list
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب التصنيفات: ' + error.message });
  }
});

// GET /admin/categories - Admin full list (includes disabled)
router.get('/admin', authenticateToken, requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER']), async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب التصنيفات للإدارة: ' + error.message });
  }
});

// POST /admin/categories - Create category
router.post(
  '/admin',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER']),
  upload.single('image'),
  async (req: any, res: Response) => {
    try {
      const { nameAr, nameEn, sortOrder, isActive } = req.body;

      if (!nameAr || !nameEn) {
        return res.status(400).json({ error: 'الرجاء إدخال الاسم بالعربية والإنجليزية' });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const category = await prisma.category.create({
        data: {
          nameAr,
          nameEn,
          sortOrder: sortOrder ? parseInt(sortOrder) : 0,
          isActive: isActive === 'false' ? false : true,
          image: imageUrl,
        },
      });

      res.status(201).json(category);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء إنشاء التصنيف: ' + error.message });
    }
  }
);

// PUT /admin/categories/:id - Update category
router.put(
  '/admin/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER']),
  upload.single('image'),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { nameAr, nameEn, sortOrder, isActive } = req.body;

      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        return res.status(404).json({ error: 'التصنيف غير موجود' });
      }

      let imageUrl = category.image;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          nameAr: nameAr !== undefined ? nameAr : category.nameAr,
          nameEn: nameEn !== undefined ? nameEn : category.nameEn,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : category.sortOrder,
          isActive: isActive !== undefined ? (isActive === 'false' || isActive === false ? false : true) : category.isActive,
          image: imageUrl,
        },
      });

      res.json(updatedCategory);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء تحديث التصنيف: ' + error.message });
    }
  }
);

// DELETE /admin/categories/:id - Delete category
router.delete(
  '/admin/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({ where: { id } });
      if (!category) {
        return res.status(404).json({ error: 'التصنيف غير موجود' });
      }

      await prisma.category.delete({ where: { id } });
      res.json({ message: 'تم حذف التصنيف بنجاح' });
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء حذف التصنيف: ' + error.message });
    }
  }
);

export default router;
