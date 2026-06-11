import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jewelry-hamza-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'من فضلك سجل دخولك أولاً الوصول غير مصرح' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'انتهت صلاحية الجلسة أو الرمز غير صالح' });
    }
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'الوصول غير مصرح' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'ليس لديك الصلاحيات الكافية للوصول إلى هذا القسم' });
    }

    next();
  };
}
