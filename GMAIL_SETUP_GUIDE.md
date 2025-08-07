# دليل حل مشكلة Gmail SMTP

## المشكلة الحالية
❌ خطأ في مصادقة البريد الإلكتروني: يرجى التحقق من اسم المستخدم وكلمة المرور

## تشخيص المشكلة

### 1. فحص السجلات (Logs)
افتح Railway Dashboard وانتقل إلى:
- مشروعك → تبويب "Deployments" → أحدث deployment → "View Logs"
- ابحث عن رسائل الخطأ التي تبدأ بـ:
  - `❌ SMTP verification failed:`
  - `❌ Email sending error:`
  - `Error Code: EAUTH`

### 2. الأخطاء الشائعة وحلولها

#### خطأ EAUTH (Authentication Failed)
**السبب**: مشكلة في اسم المستخدم أو كلمة المرور
**الحل**:
1. تأكد من صحة بريد Gmail
2. استخدم كلمة مرور التطبيق (App Password)
3. فعّل التحقق بخطوتين أولاً

#### خطأ ECONNECTION (Connection Failed)
**السبب**: مشكلة في الاتصال أو إعدادات Gmail
**الحل**:
1. تحقق من الاتصال بالإنترنت
2. تأكد من إعدادات Gmail
3. جرب استخدام SMTP بديل

#### خطأ ETIMEDOUT (Connection Timeout)
**السبب**: بطء في الاتصال أو حظر من Gmail
**الحل**:
1. تحقق من سرعة الإنترنت
2. انتظر قليلاً وحاول مرة أخرى
3. تحقق من إعدادات Firewall

## الحلول التفصيلية

### الحل الأول: إعداد Gmail بشكل صحيح

#### الخطوة 1: تفعيل التحقق بخطوتين
1. اذهب إلى: https://myaccount.google.com/security
2. فعّل "التحقق بخطوتين" (2-Step Verification)
3. اتبع الخطوات لإكمال الإعداد

#### الخطوة 2: إنشاء كلمة مرور التطبيق
1. اذهب إلى: https://myaccount.google.com/apppasswords
2. اختر "البريد" (Mail)
3. اختر "Windows Computer" أو "Other"
4. انسخ كلمة المرور المكونة من 16 حرف

#### الخطوة 3: إضافة المتغيرات في Railway
1. اذهب إلى Railway Dashboard
2. اختر مشروعك
3. انتقل إلى تبويب "Variables"
4. أضف:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-digit-app-password
```

### الحل الثاني: استخدام بريد إلكتروني بديل

#### خيار 1: Outlook/Hotmail
```
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```
وتغيير `service: 'gmail'` إلى `service: 'outlook'`

#### خيار 2: Yahoo
```
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```
وتغيير `service: 'gmail'` إلى `service: 'yahoo'`

### الحل الثالث: استخدام SMTP مخصص

```javascript
transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
})
```

## اختبار الحل

### 1. اختبار محلي
```bash
npm run dev
# اذهب إلى http://localhost:3000/admin
# جرب إرسال بريد إلكتروني
```

### 2. اختبار على Railway
1. انتظر إعادة تشغيل التطبيق (2-3 دقائق)
2. اذهب إلى `/admin`
3. اضغط "🔍 اختبار شامل للنظام"
4. تحقق من نتيجة "اختبار إرسال البريد الإلكتروني"

### 3. فحص السجلات
في Railway Logs، ابحث عن:
- `✅ SMTP connection verified successfully`
- `✅ Email sent successfully!`

## استكشاف الأخطاء

### إذا استمرت المشكلة:

1. **تحقق من إعدادات Gmail**:
   - تأكد من تفعيل "الوصول للتطبيقات الأقل أماناً"
   - تحقق من عدم وجود حظر من Gmail

2. **جرب بريد إلكتروني مختلف**:
   - استخدم بريد Gmail آخر
   - أو جرب مزود بريد إلكتروني مختلف

3. **تحقق من متغيرات البيئة**:
   - تأكد من عدم وجود مسافات إضافية
   - تأكد من صحة التنسيق

4. **راجع السجلات الكاملة**:
   - ابحث عن جميع رسائل الخطأ
   - تحقق من Error Code و Error Message

## مثال على الإعداد الصحيح

```env
# في Railway Variables
EMAIL_USER=example@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
APP_SECRET=mosabri-calculator-secret-key-2024
ADMIN_PASSWORD=admin123
DATABASE_URL=your-postgresql-url
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_DOMAIN=mosabri.top
```

## ملاحظات مهمة

- **لا تستخدم كلمة المرور العادية**: استخدم دائماً كلمة مرور التطبيق
- **فعّل التحقق بخطوتين**: مطلوب لإنشاء كلمة مرور التطبيق
- **تحقق من السجلات**: مهم لتشخيص المشكلة بدقة
- **جرب حلول بديلة**: إذا لم يعمل Gmail، جرب مزودين آخرين

## الدعم

إذا استمرت المشكلة، أرسل:
1. رسالة الخطأ الكاملة من السجلات
2. Error Code و Error Message
3. إعدادات متغيرات البيئة (بدون كلمة المرور)
