# ForexYemeni - تداول الفوريكس

<div align="center">
  <img src="public/icon-192.png" alt="ForexYemeni Logo" width="120" height="120">
  
  <h3>نظام متكامل لإدارة توصيات الفوركس</h3>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)](https://tailwindcss.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)](https://www.prisma.io/)
</div>

---

## 📋 نظرة عامة

تطبيق **ForexYemeni** هو نظام متكامل لإدارة توصيات الفوركس مع نظام مستخدمين متكامل، يتضمن:

- ✅ نظام مصادقة آمن (تسجيل/دخول/جلسات)
- ✅ لوحة تحكم شاملة للأدمن
- ✅ إدارة المستخدمين وطلبات الانضمام
- ✅ نظام التوصيات المالية
- ✅ محادثات خاصة بين الأدمن والمستخدمين
- ✅ تكامل مع TradingView عبر Webhook
- ✅ تطبيق ويب تقدمي (PWA) قابل للتثبيت
- ✅ دعم كامل للغة العربية (RTL)

---

## 🚀 البدء السريع

### المتطلبات الأساسية

- Node.js 18 أو أحدث
- حساب GitHub
- حساب Vercel (مجاني)
- حساب Supabase (مجاني)

### التثبيت المحلي

```bash
# استنساخ المشروع
git clone https://github.com/forexyemeni2026-dotcom/ForexYemeni.git
cd ForexYemeni

# تثبيت التبعيات
npm install
# أو
bun install

# إعداد قاعدة البيانات
cp .env.example .env
npm run db:push

# تشغيل التطبيق
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

---

## 🔐 بيانات الدخول الافتراضية

| الدور | البريد الإلكتروني | كلمة المرور |
|-------|-------------------|-------------|
| الأدمن | admin@forexyemeni.com | admin123 |

> ⚠️ **تحذير:** يُنصح بتغيير كلمة المرور الافتراضية فور تسجيل الدخول لأول مرة.

---

## 📖 دليل الاستخدام

### لوحة تحكم الأدمن

#### 1. الإحصائيات
- عرض عدد المستخدمين الإجمالي
- عدد التوصيات النشطة
- طلبات الانضمام المعلقة
- الرسائل الجديدة

#### 2. إدارة المستخدمين
- عرض جميع المستخدمين المسجلين
- تعديل بيانات المستخدم (الاسم، البريد، الهاتف)
- ترقية مستخدم إلى أدمن
- تفعيل/تعطيل حساب المستخدم
- حذف المستخدم

#### 3. طلبات الانضمام
- عرض طلبات التسجيل الجديدة
- قبول الطلب (يتم إنشاء حساب تلقائياً)
- رفض الطلب مع إضافة ملاحظات

#### 4. التوصيات
- إضافة توصية يدوياً
- حذف توصيات محددة أو جميع التوصيات
- عرض تفاصيل كل توصية

#### 5. الرسائل
- المحادثة الخاصة مع كل مستخدم
- إرسال رسائل جديدة
- تحديد الرسائل المقروءة

### واجهة المستخدم العادي

#### 1. التوصيات
- عرض التوصيات المحدثة
- تصنيف حسب التاريخ
- تحديد التوصيات المقروءة

#### 2. الرسائل
- المحادثة مع الأدمن
- إرسال رسائل جديدة
- إشعارات الرسائل الجديدة

#### 3. الإعدادات
- تعديل الاسم والبريد والهاتف
- تغيير كلمة المرور
- حذف الحساب

---

## 🔗 التكامل مع TradingView

### إعداد Webhook

1. افتح [Google Apps Script](https://script.google.com)
2. أنشئ مشروعاً جديداً
3. انسخ محتوى ملف `download/google-apps-script.js`
4. عدّل المتغيرات:
   ```javascript
   const APP_URL = 'https://your-app.vercel.app';
   const API_KEY = 'forex-yemeni-webhook-2026';
   ```
5. انشر كتطبيق ويب:
   - اختر **Deploy** > **New deployment**
   - اختر **Web app**
   - **Who has access**: Anyone
   - انسخ رابط الـ Webhook

### إعداد تنبيه TradingView

1. افتح Pine Script Editor في TradingView
2. أضف الكود التالي:
   ```pinescript
   // في الاستراتيجية
   strategy.entry("Long", strategy.long)
   
   // أو في المؤشر
   alert('{"symbol":"' + syminfo.ticker + '","action":"buy","price":' + str.tostring(close) + '}', alert.freq_once_per_bar_close)
   ```
3. أنشئ تنبيهاً جديداً:
   - الشرط: تحقق الإشارة
   - الإجراء: Webhook URL
   - الصق رابط Google Apps Script

### تنسيق التوصية

```json
{
  "symbol": "EURUSD",
  "action": "buy",
  "price": 1.0850,
  "stopLoss": 1.0800,
  "takeProfit": 1.0950,
  "timeframe": "1H",
  "notes": "توصية من TradingView"
}
```

---

## 📱 تثبيت التطبيق (PWA)

### على الهاتف (Android)

1. افتح التطبيق في Chrome
2. اضغط على قائمة المتصفح (⋮)
3. اختر "إضافة إلى الشاشة الرئيسية"
4. اضغط "تثبيت"

### على iPhone

1. افتح التطبيق في Safari
2. اضغط على زر المشاركة (↑)
3. اختر "إضافة إلى الشاشة الرئيسية"
4. اضغط "إضافة"

---

## 🚀 دليل النشر على Vercel + Supabase

### الخطوة 1: إنشاء حساب Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. سجّل حساباً مجانياً باستخدام GitHub
3. أنشئ مشروعاً جديداً:
   - **Name**: forexyemeni
   - **Database Password**: (احفظها!)
   - **Region**: اختر الأقرب إليك

### الخطوة 2: الحصول على رابط قاعدة البيانات

1. في لوحة Supabase، اذهب إلى **Settings** > **Database**
2. انسخ **Connection string** (URI format)
3. عدّله ليصبح:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### الخطوة 3: رفع المشروع على GitHub

```bash
# إنشاء مستودع جديد على GitHub
# ثم:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/forexyemeni2026-dotcom/ForexYemeni.git
git push -u origin main
```

### الخطوة 4: النشر على Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجّل باستخدام GitHub
3. اضغط **New Project**
4. اختر مستودع ForexYemeni
5. أضف المتغيرات البيئية:

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | رابط قاعدة بيانات Supabase |
| `NODE_ENV` | production |

6. اضغط **Deploy**

### الخطوة 5: إنشاء الجداول

بعد النشر، تحتاج لإنشاء الجداول في Supabase:

1. اذهب إلى **SQL Editor** في Supabase
2. انسخ والصق محتوى `prisma/schema.prisma` بعد تحويله لـ SQL
3. أو استخدم Prisma:
   ```bash
   npx prisma db push
   ```

### الخطوة 6: إنشاء الأدمن الافتراضي

في Supabase SQL Editor:

```sql
INSERT INTO User (id, email, name, password, role, isActive, isMainAdmin, createdAt, updatedAt)
VALUES (
  'admin-001',
  'admin@forexyemeni.com',
  'مدير النظام',
  '240be518fabd2724ddb6f04eeb9d5b0448c81a74e0c8c8ef8d5f5c9f0c8f7d5c',
  'admin',
  1,
  1,
  datetime('now'),
  datetime('now')
);
```

> ملاحظة: كلمة المرور المشفرة أعلاه هي `admin123` مشفرة بـ SHA-256

---

## 📁 هيكل المشروع

```
forex-yemeni/
├── prisma/
│   └── schema.prisma          # نماذج قاعدة البيانات
├── public/
│   ├── manifest.json          # إعدادات PWA
│   └── icon-*.png             # أيقونات التطبيق
├── src/
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   ├── auth/          # المصادقة
│   │   │   ├── users/         # المستخدمين
│   │   │   ├── requests/      # طلبات الانضمام
│   │   │   ├── recommendations/  # التوصيات
│   │   │   ├── messages/      # الرسائل
│   │   │   ├── notifications/ # الإشعارات
│   │   │   ├── settings/      # الإعدادات
│   │   │   └── integration/   # التكامل الخارجي
│   │   ├── globals.css        # التنسيقات العامة
│   │   ├── layout.tsx         # التخطيط الرئيسي
│   │   └── page.tsx           # الصفحة الرئيسية
│   ├── components/            # مكونات UI
│   └── lib/
│       ├── auth.ts            # وظائف المصادقة
│       ├── db.ts              # اتصال قاعدة البيانات
│       └── store.ts           # إدارة الحالة
├── download/
│   └── google-apps-script.js  # سكربت التكامل
├── .env.example               # مثال للمتغيرات البيئية
└── package.json               # التبعيات
```

---

## 🔒 الأمان

- ✅ تشفير كلمات المرور بـ SHA-256
- ✅ جلسات آمنة مع رمز فريد
- ✅ التحقق من الصلاحيات في كل طلب API
- ✅ حماية من CSRF و XSS
- ✅ مفتاح API للتكامل الخارجي

---

## 💰 التكلفة

**المشروع مجاني 100%** بدون أي رسوم:

| الخدمة | الخطة | التكلفة |
|--------|-------|---------|
| GitHub | Free | $0 |
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |

---

## 📞 الدعم

للمساعدة أو الاستفسارات:

- 📧 البريد: admin@forexyemeni.com
- 💬 المحادثة: من داخل التطبيق

---

## 📄 الترخيص

هذا المشروع مفتوح المصدر للاستخدام الشخصي والتجاري.

---

<div align="center">
  <p>صُنع بـ ❤️ للمتداولين اليمنيين</p>
</div>
