-- =============================================
-- سكربت إصلاح قاعدة البيانات لـ ForexYemeni
-- قم بنسخ وتشغيل كل أمر على حدة في Supabase SQL Editor
-- =============================================

-- 1. حذف الجداول الموجودة (قم بتشغيل كل سطر على حدة)
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Recommendation" CASCADE;
DROP TABLE IF EXISTS "RegistrationRequest" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- 2. إنشاء جدول المستخدمين
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT DEFAULT 'user',
    "isActive" BOOLEAN DEFAULT true,
    "isMainAdmin" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

-- 3. إنشاء جدول طلبات التسجيل
CREATE TABLE "RegistrationRequest" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT now(),
    "processedAt" TIMESTAMP,
    "processedBy" TEXT
);

-- 4. إنشاء جدول التوصيات
CREATE TABLE "Recommendation" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "symbol" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "timeframe" TEXT,
    "notes" TEXT,
    "source" TEXT DEFAULT 'manual',
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT now(),
    "expiresAt" TIMESTAMP,
    "userId" TEXT
);

-- 5. إنشاء جدول الرسائل
CREATE TABLE "Message" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT now(),
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL
);

-- 6. إنشاء جدول الإشعارات
CREATE TABLE "Notification" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT now(),
    "userId" TEXT NOT NULL
);

-- 7. إنشاء جدول الجلسات
CREATE TABLE "Session" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "token" TEXT UNIQUE NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now(),
    "userId" TEXT NOT NULL
);

-- 8. إضافة الفهارس والمفاتيح الأجنبية
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- 9. إنشاء حساب الأدمن الرئيسي
-- كلمة المرور: m773057153M@#$778288150omy
-- الـ hash: 28e0d33eed3b6cdad65b896de36588c3e0ad9a8f731d113ccb3480c28c94b39a
INSERT INTO "User" ("email", "name", "password", "role", "isMainAdmin", "isActive")
VALUES ('forexyemeni2026@gmail.com', 'مدير النظام', '28e0d33eed3b6cdad65b896de36588c3e0ad9a8f731d113ccb3480c28c94b39a', 'admin', true, true);

-- 10. التحقق من إنشاء المستخدم
SELECT * FROM "User";
