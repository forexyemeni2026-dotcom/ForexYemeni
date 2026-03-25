import { db } from './db';
import crypto from 'crypto';

// تشفير كلمة المرور بـ SHA-256 (يعمل في جميع البيئات)
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// إنشاء رمز جلسة عشوائي
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// التحقق من صلاحية الجلسة
export async function validateSession(token: string) {
  if (!token) return null;

  try {
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) return null;

    // التحقق من انتهاء صلاحية الجلسة
    if (new Date() > session.expiresAt) {
      await db.session.delete({ where: { id: session.id } });
      return null;
    }

    return session;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

// إنشاء جلسة جديدة
export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const session = await db.session.create({
    data: {
      token,
      expiresAt,
      userId,
    },
  });

  return session;
}

// حذف الجلسة (تسجيل الخروج)
export async function deleteSession(token: string) {
  try {
    await db.session.delete({ where: { token } });
  } catch {
    // الجلسة غير موجودة
  }
}

// التحقق من بيانات الدخول
export async function authenticateUser(email: string, password: string) {
  try {
    const hashedPassword = hashPassword(password);

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    if (user.password !== hashedPassword) return null;

    if (!user.isActive) return { error: 'تم تعطيل حسابك. يرجى التواصل مع الإدارة.' };

    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// إنشاء الأدمن الافتراضي
export async function createDefaultAdmin() {
  try {
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@forexyemeni.com' },
    });

    if (!existingAdmin) {
      await db.user.create({
        data: {
          email: 'admin@forexyemeni.com',
          name: 'مدير النظام',
          password: hashPassword('admin123'),
          role: 'admin',
          isMainAdmin: true,
          isActive: true,
        },
      });
      console.log('تم إنشاء حساب الأدمن الافتراضي');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

// الحصول على المستخدم الحالي من الكوكيز
export async function getCurrentUser(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  try {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...v] = c.trim().split('=');
        return [key, v.join('=')];
      })
    );

    const token = cookies.session_token;
    if (!token) return null;

    const session = await validateSession(token);
    return session?.user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// التحقق من صلاحيات الأدمن
export function isAdmin(user: { role: string } | null): boolean {
  return user?.role === 'admin';
}
