import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin, hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isMainAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المستخدمين' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, phone, role, isActive } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'الاسم والبريد وكلمة المرور مطلوبون' },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashPassword(password),
        phone: phone || null,
        role: role || 'user',
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المستخدم' },
      { status: 500 }
    );
  }
}
