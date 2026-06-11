import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET /admin/dashboard/stats - Admin dashboard overview aggregates
router.get(
  '/stats',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER', 'ORDERS_MANAGER']),
  async (req, res) => {
    try {
      const [
        totalProducts,
        totalAppointments,
        totalCustomOrders,
        totalCustomers,
        totalCategories,
        totalBranches,
        latestAppointments,
        latestCustomOrders,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.appointment.count(),
        prisma.customOrder.count(),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.category.count(),
        prisma.branch.count(),
        prisma.appointment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { branch: true },
        }),
        prisma.customOrder.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { branch: true },
        }),
      ]);

      // Get popular products by how many times they have been favorited
      const popularProductsRaw = await prisma.favorite.groupBy({
        by: ['productId'],
        _count: {
          productId: true,
        },
        orderBy: {
          _count: {
            productId: 'desc',
          },
        },
        take: 5,
      });

      const popularProductIds = popularProductsRaw.map((p) => p.productId);
      const popularProductsDetails = await prisma.product.findMany({
        where: {
          id: { in: popularProductIds },
        },
        include: {
          images: { take: 1 },
          category: true,
        },
      });

      // Map count back
      const popularProducts = popularProductsDetails.map((prod) => {
        const favoriteCount = popularProductsRaw.find((p) => p.productId === prod.id)?._count.productId || 0;
        return {
          ...prod,
          favoriteCount,
        };
      }).sort((a, b) => b.favoriteCount - a.favoriteCount);

      // Fallback if no favorites yet
      if (popularProducts.length === 0) {
        const fallbacks = await prisma.product.findMany({
          take: 5,
          where: { isBestSeller: true },
          include: { images: { take: 1 }, category: true },
        });
        popularProducts.push(...fallbacks.map((f) => ({ ...f, favoriteCount: 0 })));
      }

      // Structure monthly custom orders chart data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentOrders = await prisma.customOrder.findMany({
        where: {
          createdAt: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          budget: true,
          createdAt: true,
        },
      });

      const monthsArabic = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];

      const monthlyChartData: Record<string, { month: string; budget: number; count: number }> = {};
      
      // Initialize past 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = monthsArabic[d.getMonth()];
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyChartData[key] = { month: monthName, budget: 0, count: 0 };
      }

      recentOrders.forEach((order) => {
        const date = new Date(order.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyChartData[key]) {
          monthlyChartData[key].count += 1;
          monthlyChartData[key].budget += order.budget || 0;
        }
      });

      res.json({
        counts: {
          products: totalProducts,
          categories: totalCategories,
          branches: totalBranches,
          appointments: totalAppointments,
          customOrders: totalCustomOrders,
        },
        latestAppointments,
        latestCustomOrders,
        monthlyCustomOrders: Object.values(monthlyChartData).map((m) => ({
          month: m.month,
          total: m.budget,
          count: m.count,
        })),
        popularProducts,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء جلب إحصائيات لوحة التحكم: ' + error.message });
    }
  }
);

export default router;
