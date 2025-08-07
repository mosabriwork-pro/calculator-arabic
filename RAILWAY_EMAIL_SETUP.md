# إعداد البريد الإلكتروني في Railway - دليل سريع

## المشكلة الحالية
❌ خطأ في إعدادات البريد الإلكتروني: يرجى التحقق من متغيرات البيئة EMAIL_USER و EMAIL_PASS

## الحل السريع

### الخطوة 1: إضافة متغيرات البيئة في Railway

1. **افتح Railway Dashboard**
   - اذهب إلى: https://railway.app/dashboard
   - اختر مشروعك

2. **انتقل إلى تبويب Variables**
   - اضغط على تبويب "Variables" في أعلى الصفحة

3. **أضف المتغيرات التالية**:
   ```
   EMAIL_USER=mosabri.pro@gmail.com
   EMAIL_PASS=mosabri2024pro
   ```

4. **اضغط Save**
   - سيتم إعادة تشغيل التطبيق تلقائياً

### الخطوة 2: اختبار الحل

1. انتظر 2-3 دقائق لإعادة التشغيل
2. اذهب إلى `/admin`
3. جرب إرسال بريد إلكتروني
4. يجب أن يعمل الآن!

## إذا لم يعمل Gmail

### خيار 1: استخدام بريد Gmail آخر
```
EMAIL_USER=your-other-gmail@gmail.com
EMAIL_PASS=your-app-password
```

### خيار 2: استخدام Outlook
```
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### خيار 3: استخدام Yahoo
```
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

## ملاحظات مهمة

- **لا تضع مسافات** قبل أو بعد القيم
- **تأكد من صحة البريد الإلكتروني**
- **استخدم كلمة مرور التطبيق** إذا كان التحقق بخطوتين مفعل
- **انتظر إعادة التشغيل** بعد إضافة المتغيرات

## فحص السجلات

إذا استمرت المشكلة:
1. اذهب إلى "Deployments" → أحدث deployment → "View Logs"
2. ابحث عن رسائل الخطأ
3. أرسل لي السجلات لأتمكن من المساعدة
