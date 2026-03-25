import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin, hashPassword } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const { id } = await params;

    // المستخدم يمكنه رؤية بياناته فقط، والأدمن يمكنه رؤية الجميع
    if (currentUser.id !== id && !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id },
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
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات المستخدم' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const { id } = await params;

    // المستخدم يمكنه تعديل بياناته فقط، والأدمن يمكنه تعديل الجميع
    if (currentUser.id !== id && !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, phone, role, isActive } = body;

    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // منع تعديل الأدمن الرئيسي
    if (existingUser.isMainAdmin && currentUser.id !== id) {
      return NextResponse.json(
        { error: 'لا يمكن تعديل الأدمن الرئيسي' },
        { status: 403 }
      );
    }

    // التحقق من عدم تكرار البريد
    if (email && email !== existingUser.email) {
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
      role?: string;
      isActive?: boolean;
    } = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = hashPassword(password);
    if (phone !== undefined) updateData.phone = phone || null;

    // الأدمن فقط يمكنه تغيير الدور والحالة
    if (isAdmin(currentUser)) {
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
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
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المستخدم' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const { id } = await params;

    // المستخدم يمكنه حذف حسابه فقط، والأدمن يمكنه حذف الجميع
    if (currentUser.id !== id && !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // منع حذف الأدمن الرئيسي
    if (user.isMainAdmin) {
      return NextResponse.json(
        { error: 'لا يمكن حذف الأدمن الرئيسي' },
        { status: 403 }
      );
    }

    // حذف الجلسات والرسائل والإشعارات المرتبطة
    await db.session.deleteMany({ where: { userId: id } });
    await db.message.deleteMany({ where: { senderId: id } });
    await db.message.deleteMany({ where: { receiverId: id } });
    await db.notification.deleteMany({ where: { userId: id } });

    // حذف المستخدم
    await db.user.delete({ where: { id } });

    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المستخدم' },
      { status: 500 }
    );
  }
}
