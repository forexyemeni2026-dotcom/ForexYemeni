import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبون' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود البريد مسبقاً
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود طلب سابق
    const existingRequest = await db.registrationRequest.findUnique({
      where: { email },
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'لديك طلب تسجيل معلق بالفعل. يرجى انتظار الموافقة.' },
          { status: 400 }
        );
      }
      if (existingRequest.status === 'approved') {
        return NextResponse.json(
          { error: 'تمت الموافقة على طلبك مسبقاً. يرجى تسجيل الدخول.' },
          { status: 400 }
        );
      }
    }

    // إنشاء طلب تسجيل جديد
    const registrationRequest = await db.registrationRequest.create({
      data: {
        name,
        email,
        password: hashPassword(password),
        phone: phone || null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      message: 'تم إرسال طلب التسجيل بنجاح. سنتواصل معك بعد مراجعة الطلب.',
      requestId: registrationRequest.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    );
  }
}
