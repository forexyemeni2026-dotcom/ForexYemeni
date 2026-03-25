import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let messages;

    if (userId) {
      // جلب المحادثة مع مستخدم محدد
      messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: userId },
            { senderId: userId, receiverId: currentUser.id },
          ],
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true },
          },
          receiver: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // تحديد الرسائل كمقروءة
      await db.message.updateMany({
        where: {
          senderId: userId,
          receiverId: currentUser.id,
          isRead: false,
        },
        data: { isRead: true },
      });
    } else {
      // جلب جميع المحادثات
      messages = await db.message.findMany({
        where: {
          OR: [{ senderId: currentUser.id }, { receiverId: currentUser.id }],
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true },
          },
          receiver: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الرسائل' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'المستقبل والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستقبل
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // المستخدم العادي يمكنه إرسال رسائل للأدمن فقط
    if (!isAdmin(currentUser) && receiver.role !== 'admin') {
      return NextResponse.json(
        { error: 'يمكنك إرسال رسائل للأدمن فقط' },
        { status: 403 }
      );
    }

    const message = await db.message.create({
      data: {
        content,
        senderId: currentUser.id,
        receiverId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true },
        },
        receiver: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // إنشاء إشعار للمستقبل
    await db.notification.create({
      data: {
        title: 'رسالة جديدة',
        content: `رسالة من ${currentUser.name}`,
        type: 'message',
        userId: receiverId,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال الرسالة' },
      { status: 500 }
    );
  }
}
