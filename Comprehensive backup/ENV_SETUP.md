# 🔧 إعداد متغيرات البيئة

## 📝 إنشاء ملف .env.local

قم بإنشاء ملف `.env.local` في المجلد الرئيسي للمشروع وأضف المحتوى التالي:

```env
# Email Configuration
EMAIL_USER=mosabriwork@gmail.com
EMAIL_PASS=twtn tqfw scwx dzkp

# Application Secret (for access code generation)
APP_SECRET=9f3a6b1d2e4c5a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef001122334455667788
```

## ⚠️ ملاحظات مهمة:

1. **لا تشارك هذا الملف** مع أي شخص
2. **لا ترفعه** إلى GitHub أو أي منصة أخرى
3. **احتفظ به** في مكان آمن
4. **الملف مدرج** في `.gitignore` لحمايته

## 🔐 الأمان:

- **EMAIL_USER:** بريد Gmail الخاص بك
- **EMAIL_PASS:** كلمة مرور التطبيقات (16 حرف)
- **APP_SECRET:** مفتاح سري لتوليد رموز الوصول

## 🚀 بعد الإنشاء:

1. أعد تشغيل الخادم: `npm run dev`
2. تأكد من عمل إرسال البريد الإلكتروني
3. اختبر نظام تسجيل الدخول

## 📞 الدعم:

إذا واجهت أي مشاكل، تأكد من:
- صحة بيانات Gmail
- تفعيل "كلمة مرور التطبيقات" في Gmail
- عدم وجود مسافات إضافية في الملف 