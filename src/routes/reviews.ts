import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Add a product review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Product not found
 */
router.post(
  '/',
  authenticateToken,
  async (req: any, res: Response) => {
    try {
      const { productId, rating, comment } = req.body;
      const userId = req.user.id;
      const userName = req.user.name;

      if (!productId) {
        return res.status(400).json({ error: 'معرف المنتج مطلوب' });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'الرجاء إدخال تقييم صحيح بين 1 و 5 نجوم' });
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return res.status(404).json({ error: 'المنتج المحدد غير موجود' });
      }

      // Check if user already reviewed this product to prevent spam (optional, let's allow multiple or update)
      // For simplicity, let's create a new review.
      const review = await prisma.review.create({
        data: {
          productId,
          userId,
          userName,
          rating: parseInt(rating),
          comment,
        },
      });

      res.status(201).json(review);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء إضافة التقييم: ' + error.message });
    }
  }
);

/**
 * @swagger
 * /api/reviews/{productId}:
 *   get:
 *     summary: Get all reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/:productId',
  async (req: any, res: Response) => {
    try {
      const { productId } = req.params;

      const reviews = await prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
      });

      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء جلب التقييمات: ' + error.message });
    }
  }
);

export default router;
