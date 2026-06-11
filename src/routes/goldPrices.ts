import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /gold-prices/current - Get latest price
router.get('/current', async (req, res) => {
  try {
    const latestPrice = await prisma.goldPrice.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestPrice) {
      return res.status(404).json({ error: 'لم يتم تعيين أسعار الذهب بعد' });
    }

    res.json(latestPrice);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب أسعار الذهب: ' + error.message });
  }
});

// GET /admin/gold-prices/history - Get pricing changes logs
router.get('/history', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const history = await prisma.goldPrice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب سجل الأسعار: ' + error.message });
  }
});

// POST /admin/gold-prices - Set new pricing rates
router.post(
  '/',
  authenticateToken,
  requireRole(['SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { karat18, karat21, karat24 } = req.body;

      if (!karat18 || !karat21 || !karat24) {
        return res.status(400).json({ error: 'الرجاء إدخال أسعار جميع العيارات' });
      }

      if (!req.user) return res.status(401).json({ error: 'غير مصرح' });

      const newPrices = await prisma.goldPrice.create({
        data: {
          karat18: parseFloat(karat18),
          karat21: parseFloat(karat21),
          karat24: parseFloat(karat24),
          updatedBy: req.user.id,
        },
      });

      res.status(201).json(newPrices);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء تحديث أسعار الذهب: ' + error.message });
    }
  }
);

export default router;
