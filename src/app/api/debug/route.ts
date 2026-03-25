import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

export async function GET() {
  const results: Record<string, unknown> = {};
  
  try {
    // Test 1: Password hash
    const testPassword = 'm773057153M@#$778288150omy';
    const hash = crypto.createHash('sha256').update(testPassword).digest('hex');
    results.passwordTest = {
      input: testPassword,
      hash: hash,
      expectedHash: '28e0d33eed3b6cdad65b896de36588c3e0ad9a8f731d113ccb3480c28c94b39a',
      matches: hash === '28e0d33eed3b6cdad65b896de36588c3e0ad9a8f731d113ccb3480c28c94b39a'
    };
  } catch (error) {
    results.passwordTest = { error: error instanceof Error ? error.message : 'Unknown error' };
  }

  try {
    // Test 2: Database connection - list all users
    const users = await db.user.findMany({
      select: { id: true, email: true, name: true, role: true, password: true }
    });
    results.databaseTest = {
      status: 'connected',
      userCount: users.length,
      users: users.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: u.password?.substring(0, 10) + '...'
      }))
    };
  } catch (error) {
    results.databaseTest = { 
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    };
  }

  try {
    // Test 3: Find specific admin user
    const adminEmail = 'forexyemeni2026@gmail.com';
    const admin = await db.user.findUnique({
      where: { email: adminEmail }
    });
    results.adminSearch = {
      found: !!admin,
      admin: admin ? {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        passwordHash: admin.password
      } : null
    };
  } catch (error) {
    results.adminSearch = { error: error instanceof Error ? error.message : 'Unknown error' };
  }

  try {
    // Test 4: Environment check
    const dbUrl = process.env.DATABASE_URL || '';
    results.environment = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: dbUrl.length,
      databaseUrlStart: dbUrl.substring(0, 30) + '...',
      databaseUrlFirstChars: dbUrl.substring(0, 15),
      startsWithPostgres: dbUrl.startsWith('postgres'),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };
  } catch (error) {
    results.environment = { error: error instanceof Error ? error.message : 'Unknown error' };
  }

  return NextResponse.json(results, { status: 200 });
}
