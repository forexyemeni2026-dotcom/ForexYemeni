import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, deleteSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const user = await getCurrentUser(cookieHeader);

    if (user) {
      const cookies = Object.fromEntries(
        (cookieHeader || '').split(';').map(c => {
          const [key, ...v] = c.trim().split('=');
          return [key, v.join('=')];
        })
      );
      const token = cookies.session_token;
      if (token) {
        await deleteSession(token);
      }
    }

    const response = NextResponse.json({ message: 'تم تسجيل الخروج بنجاح' });
    response.cookies.delete('session_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  }
}
