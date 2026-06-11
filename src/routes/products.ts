import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// GET /products - Public catalog with advanced filtering
router.get('/', async (req, res) => {
  try {
    const {
      category,
      karat,
      minPrice,
      maxPrice,
      minWeight,
      maxWeight,
      search,
      featured,
      bestSeller,
      newArrival,
      offer,
      sort,
      availability,
    } = req.query;

    const where: any = { isActive: true };

    if (category) {
      where.categoryId = category as string;
    }

    if (karat) {
      where.karat = parseInt(karat as string);
    }

    if (availability) {
      where.availabilityStatus = availability as string;
    }

    // Price Filter
    if (minPrice || maxPrice) {
      where.estimatedPrice = {};
      if (minPrice) where.estimatedPrice.gte = parseFloat(minPrice as string);
      if (maxPrice) where.estimatedPrice.lte = parseFloat(maxPrice as string);
    }

    // Weight Filter
    if (minWeight || maxWeight) {
      where.weight = {};
      if (minWeight) where.weight.gte = parseFloat(minWeight as string);
      if (maxWeight) where.weight.lte = parseFloat(maxWeight as string);
    }

    // Badge Filters
    if (featured === 'true') where.isFeatured = true;
    if (bestSeller === 'true') where.isBestSeller = true;
    if (newArrival === 'true') where.isNewArrival = true;
    if (offer === 'true') where.isOffer = true;

    // Search query (across nameAr, nameEn, descriptionAr, descriptionEn)
    if (search) {
      const searchStr = search as string;
      where.OR = [
        { nameAr: { contains: searchStr } },
        { nameEn: { contains: searchStr } },
        { descriptionAr: { contains: searchStr } },
        { descriptionEn: { contains: searchStr } },
      ];
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }; // default: newest
    if (sort === 'price_asc') {
      orderBy = { estimatedPrice: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { estimatedPrice: 'desc' };
    } else if (sort === 'weight_asc') {
      orderBy = { weight: 'asc' };
    } else if (sort === 'weight_desc') {
      orderBy = { weight: 'desc' };
    } else if (sort === 'popular') {
      orderBy = { isBestSeller: 'desc' };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        category: {
          select: { nameAr: true, nameEn: true },
        },
      },
      orderBy,
    });

    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المنتجات: ' + error.message });
  }
});

// GET /products/featured - Featured products convenience helper
router.get('/featured', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
      take: 8,
    });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المنتجات المميزة: ' + error.message });
  }
});

// GET /products/:id - Single product detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب تفاصيل المنتج: ' + error.message });
  }
});

// GET /admin/products - Full list for Admin (includes inactive)
router.get('/admin/all', authenticateToken, requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER']), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ للإدارة: ' + error.message });
  }
});

// POST /admin/products - Create product metadata
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER']), async (req, res) => {
  try {
    const {
      categoryId,
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      karat,
      weight,
      makingCost,
      estimatedPrice,
      stoneType,
      availabilityStatus,
      isFeatured,
      isBestSeller,
      isNewArrival,
      isOffer,
      isActive,
    } = req.body;

    if (!categoryId || !nameAr || !nameEn || !karat || !weight) {
      return res.status(400).json({ error: 'الرجاء إدخال البيانات الأساسية للمنتج' });
    }

    const product = await prisma.product.create({
      data: {
        categoryId,
        nameAr,
        nameEn,
        descriptionAr: descriptionAr || '',
        descriptionEn: descriptionEn || '',
        karat: parseInt(karat),
        weight: parseFloat(weight),
        makingCost: parseFloat(makingCost || 0),
        estimatedPrice: parseFloat(estimatedPrice || 0),
        stoneType: stoneType || null,
        availabilityStatus: availabilityStatus || 'AVAILABLE',
        isFeatured: isFeatured === true || isFeatured === 'true',
        isBestSeller: isBestSeller === true || isBestSeller === 'true',
        isNewArrival: isNewArrival === undefined || isNewArrival === true || isNewArrival === 'true',
        isOffer: isOffer === true || isOffer === 'true',
        isActive: isActive === undefined || isActive === true || isActive === 'true',
      },
    });

    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المنتج: ' + error.message });
  }
});

// PUT /admin/products/:id - Update product metadata
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    const updatedData: any = {};
    if (data.categoryId !== undefined) updatedData.categoryId = data.categoryId;
    if (data.nameAr !== undefined) updatedData.nameAr = data.nameAr;
    if (data.nameEn !== undefined) updatedData.nameEn = data.nameEn;
    if (data.descriptionAr !== undefined) updatedData.descriptionAr = data.descriptionAr;
    if (data.descriptionEn !== undefined) updatedData.descriptionEn = data.descriptionEn;
    if (data.karat !== undefined) updatedData.karat = parseInt(data.karat);
    if (data.weight !== undefined) updatedData.weight = parseFloat(data.weight);
    if (data.makingCost !== undefined) updatedData.makingCost = parseFloat(data.makingCost);
    if (data.estimatedPrice !== undefined) updatedData.estimatedPrice = parseFloat(data.estimatedPrice);
    if (data.stoneType !== undefined) updatedData.stoneType = data.stoneType;
    if (data.availabilityStatus !== undefined) updatedData.availabilityStatus = data.availabilityStatus;
    if (data.isFeatured !== undefined) updatedData.isFeatured = data.isFeatured === true || data.isFeatured === 'true';
    if (data.isBestSeller !== undefined) updatedData.isBestSeller = data.isBestSeller === true || data.isBestSeller === 'true';
    if (data.isNewArrival !== undefined) updatedData.isNewArrival = data.isNewArrival === true || data.isNewArrival === 'true';
    if (data.isOffer !== undefined) updatedData.isOffer = data.isOffer === true || data.isOffer === 'true';
    if (data.isActive !== undefined) updatedData.isActive = data.isActive === true || data.isActive === 'true';

    const product = await prisma.product.update({
      where: { id },
      data: updatedData,
    });

    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث المنتج: ' + error.message });
  }
});

// DELETE /admin/products/:id - Delete product
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ message: 'تم حذف المنتج بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء حذف المنتج: ' + error.message });
  }
});

// POST /admin/products/:id/images - Upload multiple images for a product
router.post(
  '/:id/images',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER']),
  upload.array('images', 5),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        return res.status(404).json({ error: 'المنتج غير موجود' });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'الرجاء اختيار صورة واحدة على الأقل لرفعها' });
      }

      // Find current highest sort order
      const highestImage = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: { sortOrder: 'desc' },
      });
      let nextSortOrder = highestImage ? highestImage.sortOrder + 1 : 0;

      const imagesCreated = [];
      for (const file of files) {
        const img = await prisma.productImage.create({
          data: {
            productId: id,
            imageUrl: `/uploads/${file.filename}`,
            sortOrder: nextSortOrder++,
          },
        });
        imagesCreated.push(img);
      }

      res.status(201).json(imagesCreated);
    } catch (error: any) {
      res.status(500).json({ error: 'حدث خطأ أثناء رفع الصور: ' + error.message });
    }
  }
);

// DELETE /admin/products/images/:imageId - Delete single image
router.delete('/images/:imageId', authenticateToken, requireRole(['SUPER_ADMIN', 'PRODUCTS_MANAGER']), async (req, res) => {
  try {
    const { imageId } = req.params;
    const img = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img) {
      return res.status(404).json({ error: 'الصورة غير موجودة' });
    }

    await prisma.productImage.delete({ where: { id: imageId } });
    res.json({ message: 'تم حذف الصورة بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الصورة: ' + error.message });
  }
});

export default router;
