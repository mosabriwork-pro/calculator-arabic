# حاسبة موصبري المتقدمة - النسخة المحسنة

## 🚀 نظام تغذية رياضي متقدم للاعبين

حاسبة متطورة لتخطيط التغذية الرياضية المخصصة للاعبين، مع تحسينات شاملة للأداء لاستيعاب 100+ مستخدم يومياً.

---

## ✨ المميزات الرئيسية

### 🏃‍♂️ **حسابات متقدمة**
- **BMR Calculator**: حساب معدل الأيض الأساسي
- **TEE Calculator**: حساب إجمالي استهلاك الطاقة
- **Ideal Weight**: حساب الوزن المثالي حسب المركز
- **Nutrition Plans**: خطط غذائية مخصصة (محافظة، زيادة، نقصان)

### 📊 **تقارير شاملة**
- **PDF Reports**: تقارير PDF مفصلة ومحسنة
- **Interactive Charts**: رسوم بيانية تفاعلية
- **Nutrition Analysis**: تحليل تغذوي شامل
- **Performance Tips**: نصائح لتحسين الأداء

### 🔐 **نظام أمان متقدم**
- **Email Verification**: تحقق عبر البريد الإلكتروني
- **Rate Limiting**: حماية من الإفراط في الاستخدام
- **Access Control**: تحكم في الوصول
- **Admin Panel**: لوحة تحكم آمنة

---

## ⚡ التحسينات الجديدة للأداء

### **🚀 تحسينات الخادم**
- **Connection Pooling**: إعادة استخدام الاتصالات
- **Request Queue**: قائمة انتظار للطلبات
- **Enhanced Caching**: تخزين مؤقت محسن
- **Performance Monitoring**: مراقبة الأداء الفورية

### **📱 تحسينات الواجهة**
- **Memoization**: تجنب إعادة الحسابات
- **Lazy Loading**: تحميل كسول للمكونات
- **Chart Optimization**: تحسين الرسوم البيانية
- **Memory Management**: إدارة ذكية للذاكرة

### **🛡️ الأمان والاستقرار**
- **Rate Limiting**: حد 5 رسائل/دقيقة لكل IP
- **Error Handling**: معالجة أخطاء محسنة
- **Graceful Degradation**: تدهور لطيف
- **System Health**: فحص صحة النظام

---

## 📈 مقاييس الأداء

| الوظيفة | وقت الاستجابة | التحسن |
|---------|---------------|--------|
| إرسال البريد | 500-1500ms | 60-75% ⚡ |
| التحقق من الرمز | 20-80ms | 70-80% ⚡ |
| حساب الخطة | 10-30ms | 70-80% ⚡ |
| إنشاء PDF | 1500-4000ms | 50-60% ⚡ |

**قدرة الاستيعاب:** 100-500 مستخدم يومياً 🚀

---

## 🛠️ التثبيت والتشغيل

### **المتطلبات**
```bash
Node.js 18+ 
npm 9+
```

### **التثبيت**
```bash
# استنساخ المشروع
git clone [repository-url]
cd calculator-arabic

# تثبيت التبعيات
npm install

# إعداد المتغيرات البيئية
cp .env.example .env.local
# تعديل .env.local بالمعلومات المطلوبة

# تشغيل الخادم
npm run dev
```

### **المتغيرات البيئية**
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Security
APP_SECRET=your-secret-key

# Server Configuration
NODE_ENV=production
```

---

## 📁 هيكل المشروع

```
calculator-arabic/
├── src/
│   ├── app/
│   │   ├── api/           # API Routes
│   │   ├── calculator/    # Calculator Page
│   │   ├── login/         # Login Page
│   │   ├── admin/         # Admin Panel
│   │   └── send-email/    # Email Request Page
│   ├── utils/             # Utility Functions
│   │   ├── performance.ts
│   │   ├── server-optimization.ts
│   │   └── client-optimization.ts
│   └── components/        # React Components
├── public/                # Static Files
├── docs/                  # Documentation
└── PERFORMANCE_OPTIMIZATION_REPORT.md
```

---

## 🔧 الأدوات الجديدة

### **Performance Utilities**
- **`src/utils/performance.ts`**: أدوات تحسين الأداء العامة
- **`src/utils/server-optimization.ts`**: تحسينات الخادم
- **`src/utils/client-optimization.ts`**: تحسينات الواجهة

### **Monitoring Tools**
- **Performance Tracker**: تتبع الأداء
- **Cache Manager**: إدارة التخزين المؤقت
- **Network Monitor**: مراقبة الشبكة
- **System Health**: فحص صحة النظام

---

## 📊 استخدام النظام

### **1. طلب رمز الوصول**
- زيارة صفحة طلب البريد الإلكتروني
- إدخال البريد الإلكتروني
- استلام رمز الوصول

### **2. تسجيل الدخول**
- إدخال البريد الإلكتروني ورمز الوصول
- الوصول للحاسبة

### **3. إدخال البيانات**
- معلومات اللاعب الأساسية
- اختيار المركز ومستوى النشاط
- اختيار خطة التغذية

### **4. الحصول على النتائج**
- عرض الخطة الغذائية
- تحميل التقرير PDF
- مراجعة الرسوم البيانية

---

## 🛡️ الأمان

### **Rate Limiting**
- **Email API**: 5 رسائل/دقيقة لكل IP
- **Verification API**: 10 تحققات/دقيقة لكل IP
- **Block Duration**: 5 دقائق للحظر

### **Access Control**
- **Admin Panel**: لوحة تحكم آمنة
- **Email Verification**: تحقق عبر البريد
- **Session Management**: إدارة الجلسات

---

## 📈 المراقبة والصيانة

### **Performance Monitoring**
```bash
# مراقبة الأداء
npm run monitor

# فحص صحة النظام
npm run health-check

# تحليل الأداء
npm run analyze
```

### **Logs & Analytics**
- **Request Logs**: سجلات الطلبات
- **Performance Metrics**: مقاييس الأداء
- **Error Tracking**: تتبع الأخطاء
- **User Analytics**: تحليلات المستخدمين

---

## 🚀 النشر

### **Vercel (Recommended)**
```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel --prod
```

### **Docker**
```bash
# بناء الصورة
docker build -t calculator-arabic .

# تشغيل الحاوية
docker run -p 3000:3000 calculator-arabic
```

---

## 📋 قائمة التحقق للنشر

- [ ] إعداد المتغيرات البيئية
- [ ] اختبار جميع الوظائف
- [ ] فحص الأداء
- [ ] اختبار الأمان
- [ ] إعداد المراقبة
- [ ] النسخ الاحتياطي

---

## 🤝 المساهمة

### **الإبلاغ عن الأخطاء**
- استخدم GitHub Issues
- وصف مفصل للمشكلة
- خطوات إعادة الإنتاج

### **اقتراح التحسينات**
- فتح Pull Request
- شرح التحسين المقترح
- اختبار شامل

---

## 📞 الدعم

### **التواصل**
- **Email**: support@mosabri.com
- **WhatsApp**: +966-XXX-XXX-XXX
- **Telegram**: @mosabri_support

### **الوثائق**
- **User Guide**: دليل المستخدم
- **API Documentation**: وثائق API
- **Performance Report**: تقرير الأداء

---

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT. راجع ملف `LICENSE` للتفاصيل.

---

## 🎉 الشكر

شكراً لجميع المساهمين والمستخدمين الذين ساعدوا في تطوير وتحسين هذا النظام.

---

**الإصدار:** 2.0.0  
**تاريخ التحديث:** ديسمبر 2024  
**الحالة:** ✅ جاهز للإنتاج مع تحسينات الأداء
