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

    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const { id } = await params;

    const recommendation = await db.recommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'التوصية غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error('Get recommendation error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب التوصية' },
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
    const body = await request.json();

    const recommendation = await db.recommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'التوصية غير موجودة' }, { status: 404 });
    }

    // المستخدم يمكنه فقط تحديث حالة القراءة
    if (!isAdmin(currentUser)) {
      if (body.isRead !== undefined) {
        const updated = await db.recommendation.update({
          where: { id },
          data: { isRead: body.isRead },
        });
        return NextResponse.json({ recommendation: updated });
      }
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    // الأدمن يمكنه تحديث جميع الحقول
    const updateData: {
      symbol?: string;
      action?: string;
      price?: number;
      stopLoss?: number | null;
      takeProfit?: number | null;
      timeframe?: string | null;
      notes?: string | null;
      isRead?: boolean;
    } = {};

    if (body.symbol) updateData.symbol = body.symbol;
    if (body.action) updateData.action = body.action;
    if (body.price) updateData.price = parseFloat(body.price);
    if (body.stopLoss !== undefined) updateData.stopLoss = body.stopLoss ? parseFloat(body.stopLoss) : null;
    if (body.takeProfit !== undefined) updateData.takeProfit = body.takeProfit ? parseFloat(body.takeProfit) : null;
    if (body.timeframe !== undefined) updateData.timeframe = body.timeframe || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.isRead !== undefined) updateData.isRead = body.isRead;

    const updated = await db.recommendation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ recommendation: updated });
  } catch (error) {
    console.error('Update recommendation error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث التوصية' },
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

    await db.recommendation.delete({ where: { id } });

    return NextResponse.json({ message: 'تم حذف التوصية بنجاح' });
  } catch (error) {
    console.error('Delete recommendation error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف التوصية' },
      { status: 500 }
    );
  }
}
