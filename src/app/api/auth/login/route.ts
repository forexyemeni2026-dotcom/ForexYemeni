import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

// تشفير كلمة المرور
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// إنشاء رمز جلسة
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt:', { email, passwordLength: password?.length });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    console.log('User found:', user ? { id: user.id, email: user.email, role: user.role } : 'No user');

    if (!user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // تشفير كلمة المرور المدخلة ومقارنتها
    const hashedPassword = hashPassword(password);
    console.log('Password comparison:', { 
      input: hashedPassword.substring(0, 10) + '...', 
      stored: user.password.substring(0, 10) + '...' 
    });

    if (user.password !== hashedPassword) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // التحقق من تفعيل الحساب
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'تم تعطيل حسابك. يرجى التواصل مع الإدارة.' },
        { status: 403 }
      );
    }

    // إنشاء جلسة
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.session.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        isMainAdmin: user.isMainAdmin,
      },
    });

    // تعيين كوكي الجلسة
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    console.log('Login successful for:', email);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول: ' + (error instanceof Error ? error.message : 'خطأ غير معروف') },
      { status: 500 }
    );
  }
}
