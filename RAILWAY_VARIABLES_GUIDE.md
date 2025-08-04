# 🔧 دليل إضافة متغيرات البيئة في Railway

## 📋 **الخطوات التفصيلية:**

### **الخطوة 1: الوصول إلى Variables**
1. اذهب إلى [railway.app](https://railway.app)
2. اختر مشروعك
3. اضغط على **Variables** tab

### **الخطوة 2: إضافة المتغيرات الأساسية**

#### **1. المتغيرات المطلوبة:**
```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_DOMAIN=mosabri.top
NEXT_PUBLIC_SITE_URL=https://mosabri.top
CUSTOM_KEY=9f3a6b1d2e4c5a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef001122334455667788
```

#### **2. كيفية الإضافة:**
- اضغط **"New Variable"**
- اكتب اسم المتغير (مثل: `NODE_ENV`)
- اكتب القيمة (مثل: `production`)
- اضغط **"Add"**

### **الخطوة 3: إضافة متغيرات البريد الإلكتروني (اختياري)**

#### **إذا كنت تستخدم Gmail:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

#### **كيفية الحصول على App Password من Gmail:**
1. اذهب إلى [Google Account Settings](https://myaccount.google.com/)
2. اذهب إلى **Security**
3. فعّل **2-Step Verification**
4. اذهب إلى **App passwords**
5. أنشئ كلمة مرور جديدة للتطبيق
6. استخدم هذه الكلمة في `EMAIL_PASS`

### **الخطوة 4: إضافة متغيرات إضافية**
```env
NEXT_PUBLIC_APP_NAME=حاسبة موصبري
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🔍 **كيف تتأكد من المتغيرات؟**

### **الطريقة 1: في Railway Dashboard**
1. اذهب إلى **Variables** tab
2. ستجد قائمة بجميع المتغيرات
3. تأكد من وجود القيم الصحيحة

### **الطريقة 2: في الكود**
```javascript
// في أي ملف في مشروعك
console.log('Domain:', process.env.NEXT_PUBLIC_DOMAIN)
console.log('Email Host:', process.env.EMAIL_HOST)
```

### **الطريقة 3: في API Route**
```javascript
// في src/app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    domain: process.env.NEXT_PUBLIC_DOMAIN,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT
  })
}
```

## 🛡️ **أمان المتغيرات:**

### **قواعد مهمة:**
1. **لا تضع المتغيرات في الكود**
2. **لا تشارك المتغيرات مع أحد**
3. **استخدم قيم مختلفة لكل بيئة**
4. **احذف المتغيرات القديمة**

### **أسماء المتغيرات:**
- `NEXT_PUBLIC_*` - مرئية في المتصفح
- بدون `NEXT_PUBLIC_` - سرية (فقط في الخادم)

## 📊 **قائمة التحقق:**

### **المتغيرات الأساسية:**
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `NEXT_PUBLIC_DOMAIN=mosabri.top`
- [ ] `NEXT_PUBLIC_SITE_URL=https://mosabri.top`
- [ ] `CUSTOM_KEY=your-secret-key`

### **متغيرات البريد الإلكتروني (اختياري):**
- [ ] `EMAIL_HOST=smtp.gmail.com`
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_USER=your-email@gmail.com`
- [ ] `EMAIL_PASS=your-app-password`
- [ ] `EMAIL_FROM=your-email@gmail.com`

### **متغيرات إضافية:**
- [ ] `NEXT_PUBLIC_APP_NAME=حاسبة موصبري`
- [ ] `NEXT_PUBLIC_APP_VERSION=1.0.0`

## 🆘 **مشاكل شائعة:**

### **1. المتغير لا يظهر:**
- تأكد من إعادة النشر
- تحقق من اسم المتغير
- تأكد من عدم وجود مسافات

### **2. قيمة المتغير خاطئة:**
- تحقق من القيمة في Railway
- أعد النشر
- تحقق من الكود

### **3. متغير NEXT_PUBLIC لا يعمل:**
- تأكد من أن الاسم يبدأ بـ `NEXT_PUBLIC_`
- أعد بناء المشروع
- تحقق من الكود

## 🎯 **نصائح مهمة:**

1. **ابدأ بالمتغيرات الأساسية فقط**
2. **أضف البريد الإلكتروني لاحقاً إذا احتجت**
3. **اختبر المتغيرات قبل النشر**
4. **احتفظ بنسخة احتياطية من المتغيرات**

---

**💡 تذكر: متغيرات البيئة تحمي معلوماتك السرية!** 