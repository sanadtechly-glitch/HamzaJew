import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /favorites - List user's favorites
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'غير مصرح' });

    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(favorites.map((f) => f.product));
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المفضلة: ' + error.message });
  }
});

// POST /favorites/:productId - Add to favorites
router.post('/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    if (!req.user) return res.status(401).json({ error: 'غير مصرح' });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
      create: {
        userId: req.user.id,
        productId,
      },
      update: {},
    });

    res.status(201).json({ success: true, favorite });
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء الإضافة للمفضلة: ' + error.message });
  }
});

// DELETE /favorites/:productId - Remove from favorites
router.delete('/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    if (!req.user) return res.status(401).json({ error: 'غير مصرح' });

    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
        productId,
      },
    });

    res.json({ success: true, message: 'تمت إزالة المنتج من المفضلة' });
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء الإزالة من المفضلة: ' + error.message });
  }
});

export default router;
