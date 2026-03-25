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

    const recommendations = await db.recommendation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب التوصيات' },
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
    const { symbol, action, price, stopLoss, takeProfit, timeframe, notes, expiresAt } = body;

    if (!symbol || !action || !price) {
      return NextResponse.json(
        { error: 'الزوج والعملة والسعر مطلوبون' },
        { status: 400 }
      );
    }

    const recommendation = await db.recommendation.create({
      data: {
        symbol,
        action,
        price: parseFloat(price),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        timeframe: timeframe || null,
        notes: notes || null,
        source: 'manual',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: currentUser.id,
      },
    });

    // إنشاء إشعارات لجميع المستخدمين
    const users = await db.user.findMany({
      where: { isActive: true, role: 'user' },
    });

    await db.notification.createMany({
      data: users.map((user) => ({
        title: 'توصية جديدة',
        content: `${action === 'buy' ? 'شراء' : 'بيع'} ${symbol} @ ${price}`,
        type: 'recommendation',
        userId: user.id,
      })),
    });

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error('Create recommendation error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء التوصية' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const currentUser = await getCurrentUser(cookieHeader);

    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (ids) {
      // حذف توصيات محددة
      const idsArray = ids.split(',');
      await db.recommendation.deleteMany({
        where: { id: { in: idsArray } },
      });
      return NextResponse.json({ message: 'تم حذف التوصيات المحددة' });
    } else {
      // حذف جميع التوصيات
      await db.recommendation.deleteMany();
      return NextResponse.json({ message: 'تم حذف جميع التوصيات' });
    }
  } catch (error) {
    console.error('Delete recommendations error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف التوصيات' },
      { status: 500 }
    );
  }
}
