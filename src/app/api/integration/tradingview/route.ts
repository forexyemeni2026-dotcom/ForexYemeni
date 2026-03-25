import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// مفتاح API للتكامل (يجب تغييره في الإنتاج)
const API_KEY = 'forex-yemeni-webhook-2026';

export async function POST(request: NextRequest) {
  try {
    // التحقق من مفتاح API
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: 'مفتاح API غير صالح' }, { status: 401 });
    }

    const body = await request.json();
    const { symbol, action, price, stopLoss, takeProfit, timeframe, notes } = body;

    // التحقق من البيانات المطلوبة
    if (!symbol || !action || !price) {
      return NextResponse.json(
        { error: 'الزوج والعملة والسعر مطلوبون' },
        { status: 400 }
      );
    }

    // التحقق من صحة نوع العمل
    if (!['buy', 'sell'].includes(action.toLowerCase())) {
      return NextResponse.json(
        { error: 'نوع العمل يجب أن يكون buy أو sell' },
        { status: 400 }
      );
    }

    // إنشاء التوصية
    const recommendation = await db.recommendation.create({
      data: {
        symbol: symbol.toUpperCase(),
        action: action.toLowerCase(),
        price: parseFloat(price),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        timeframe: timeframe || null,
        notes: notes || 'توصية من TradingView',
        source: 'tradingview',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // تنتهي بعد 24 ساعة
      },
    });

    // إنشاء إشعارات لجميع المستخدمين النشطين
    const users = await db.user.findMany({
      where: { isActive: true, role: 'user' },
    });

    if (users.length > 0) {
      await db.notification.createMany({
        data: users.map((user) => ({
          title: 'توصية جديدة من TradingView',
          content: `${action === 'buy' ? 'شراء' : 'بيع'} ${symbol} @ ${price}`,
          type: 'recommendation',
          userId: user.id,
        })),
      });
    }

    return NextResponse.json({
      message: 'تم استلام التوصية بنجاح',
      recommendation: {
        id: recommendation.id,
        symbol: recommendation.symbol,
        action: recommendation.action,
        price: recommendation.price,
        createdAt: recommendation.createdAt,
      },
    });
  } catch (error) {
    console.error('TradingView webhook error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة التوصية' },
      { status: 500 }
    );
  }
}

// للحصول على معلومات التكامل
export async function GET() {
  return NextResponse.json({
    message: 'TradingView Webhook Endpoint',
    instructions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY',
      },
      body: {
        symbol: 'EURUSD',
        action: 'buy',
        price: 1.0850,
        stopLoss: 1.0800,
        takeProfit: 1.0950,
        timeframe: '1H',
        notes: 'توصية من TradingView',
      },
    },
  });
}
