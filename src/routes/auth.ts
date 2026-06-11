import { Router, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'jewelry-hamza-secret-key-2026';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'الرجاء إدخال الاسم، رقم الهاتف، وكلمة المرور' });
    }

    // Check if phone already registered
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: 'رقم الهاتف هذا مسجل بالفعل' });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: 'البريد الإلكتروني هذا مسجل بالفعل' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
    });

    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء التسجيل: ' + error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'الرجاء إدخال رقم الهاتف وكلمة المرور' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(400).json({ error: 'بيانات الاعتماد غير صحيحة، تأكد من رقم الهاتف' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'هذا الحساب تم تعطيله من قبل الإدارة' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول: ' + error.message });
  }
});

// Get profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'غير مصرح' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الملف الشخصي: ' + error.message });
  }
});

export default router;
