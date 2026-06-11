import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// GET /settings - Public get all settings key-values
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الإعدادات: ' + error.message });
  }
});

// PUT /admin/settings - Update multiple settings keys
router.put('/', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const updates = req.body; // Expect format { key1: value1, key2: value2 }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'الرجاء إدخال بيانات التحديث بالشكل الصحيح' });
    }

    const keys = Object.keys(updates);
    const updatedSettings = [];

    for (const key of keys) {
      const value = String(updates[key]);
      const setting = await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      updatedSettings.push(setting);
    }

    // Convert back to object
    const responseObj: Record<string, string> = {};
    updatedSettings.forEach((s) => {
      responseObj[s.key] = s.value;
    });

    res.json(responseObj);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث الإعدادات: ' + error.message });
  }
});

export default router;
