import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const { id } = await params;

    const registrationRequest = await db.registrationRequest.findUnique({
      where: { id },
    });

    if (!registrationRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ request: registrationRequest });
  } catch (error) {
    console.error('Get request error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الطلب' },
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

    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, notes } = body;

    const registrationRequest = await db.registrationRequest.findUnique({
      where: { id },
    });

    if (!registrationRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    if (registrationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'تم معالجة هذا الطلب مسبقاً' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // إنشاء المستخدم
      const user = await db.user.create({
        data: {
          name: registrationRequest.name,
          email: registrationRequest.email,
          password: registrationRequest.password,
          phone: registrationRequest.phone,
          role: 'user',
          isActive: true,
        },
      });

      // تحديث حالة الطلب
      await db.registrationRequest.update({
        where: { id },
        data: {
          status: 'approved',
          notes: notes || null,
          processedAt: new Date(),
          processedBy: currentUser.id,
        },
      });

      return NextResponse.json({
        message: 'تم قبول الطلب وإنشاء الحساب بنجاح',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } else if (action === 'reject') {
      await db.registrationRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          notes: notes || null,
          processedAt: new Date(),
          processedBy: currentUser.id,
        },
      });

      return NextResponse.json({ message: 'تم رفض الطلب' });
    } else {
      return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    }
  } catch (error) {
    console.error('Process request error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الطلب' },
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

    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const { id } = await params;

    await db.registrationRequest.delete({ where: { id } });

    return NextResponse.json({ message: 'تم حذف الطلب بنجاح' });
  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الطلب' },
      { status: 500 }
    );
  }
}
