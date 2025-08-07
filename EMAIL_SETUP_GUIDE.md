# دليل إعداد البريد الإلكتروني في Railway

## المشكلة الحالية
❌ خطأ في إعدادات البريد الإلكتروني: يرجى التحقق من متغيرات البيئة EMAIL_USER و EMAIL_PASS

## الحل خطوة بخطوة

### 1. إعداد Gmail
1. اذهب إلى [حساب Google](https://myaccount.google.com/)
2. انتقل إلى "الأمان" (Security)
3. فعّل "التحقق بخطوتين" (2-Step Verification)
4. اذهب إلى "كلمات مرور التطبيقات" (App passwords)
5. أنشئ كلمة مرور جديدة للتطبيق
6. احفظ كلمة المرور (ستحتاجها لاحقاً)

### 2. إضافة متغيرات البيئة في Railway
1. اذهب إلى [Railway Dashboard](https://railway.app/dashboard)
2. اختر مشروعك `calculator-arabic`
3. انتقل إلى تبويب "Variables"
4. أضف المتغيرات التالية:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. متغيرات البيئة المطلوبة
```
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-digit-app-password
APP_SECRET=mosabri-calculator-secret-key-2024
ADMIN_PASSWORD=your-admin-password
DATABASE_URL=your-postgresql-url
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_DOMAIN=mosabri.top
```

### 4. اختبار الإعداد
بعد إضافة المتغيرات:
1. انتظر إعادة تشغيل التطبيق (2-3 دقائق)
2. اذهب إلى `/admin`
3. انتقل إلى تبويب "اختبار السرعة"
4. اضغط "تشغيل جميع الاختبارات"
5. تحقق من نتيجة "اختبار إعدادات البريد الإلكتروني"

### 5. استكشاف الأخطاء
إذا استمرت المشكلة:
1. تحقق من صحة بريد Gmail
2. تأكد من تفعيل التحقق بخطوتين
3. تأكد من استخدام كلمة مرور التطبيق (وليس كلمة المرور العادية)
4. تحقق من عدم وجود مسافات إضافية في المتغيرات

## ملاحظات مهمة
- لا تستخدم كلمة المرور العادية لـ Gmail
- استخدم دائماً كلمة مرور التطبيق
- تأكد من أن Gmail يسمح بالوصول للتطبيقات الأقل أماناً
- إذا كنت تستخدم حساب Google Workspace، قد تحتاج لإعدادات إضافية
