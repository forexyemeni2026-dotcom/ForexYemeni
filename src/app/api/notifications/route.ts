import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // عدد الإشعارات غير المقروءة
    const unreadCount = await db.notification.count({
      where: { userId: currentUser.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإشعارات' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: currentUser.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: 'تم تحديد جميع الإشعارات كمقروءة' });
    }

    if (id) {
      await db.notification.update({
        where: { id, userId: currentUser.id },
        data: { isRead: true },
      });
      return NextResponse.json({ message: 'تم تحديد الإشعار كمقروء' });
    }

    return NextResponse.json({ error: 'لا يوجد إجراء محدد' }, { status: 400 });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الإشعار' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    await db.notification.deleteMany({
      where: { userId: currentUser.id },
    });

    return NextResponse.json({ message: 'تم حذف جميع الإشعارات' });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الإشعارات' },
      { status: 500 }
    );
  }
}
