import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, currentPassword, phone } = body;

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // التحقق من كلمة المرور الحالية عند تغيير كلمة المرور أو البريد
    if (password || (email && email !== user.email)) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'كلمة المرور الحالية مطلوبة' },
          { status: 400 }
        );
      }

      if (hashPassword(currentPassword) !== user.password) {
        return NextResponse.json(
          { error: 'كلمة المرور الحالية غير صحيحة' },
          { status: 400 }
        );
      }
    }

    // التحقق من عدم تكرار البريد
    if (email && email !== user.email) {
      const emailExists = await db.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }

    // بناء بيانات التحديث
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
      phone?: string | null;
    } = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = hashPassword(password);
    if (phone !== undefined) updateData.phone = phone || null;

    const updatedUser = await db.user.update({
      where: { id: currentUser.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'تم تحديث الإعدادات بنجاح',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الإعدادات' },
      { status: 500 }
    );
  }
}
