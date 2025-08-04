# ⚙️ إعدادات Railway الإضافية

## 🔧 الإعدادات المطلوبة:

### **1. متغيرات البيئة (Environment Variables):**
في Railway Dashboard > Variables:

```env
# الأساسية
NODE_ENV=production
PORT=3000

# الدومين
NEXT_PUBLIC_DOMAIN=mosabri.top
NEXT_PUBLIC_SITE_URL=https://mosabri.top

# الأمان
CUSTOM_KEY=9f3a6b1d2e4c5a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef001122334455667788

# البريد الإلكتروني (إذا كنت تستخدم SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# قاعدة البيانات (إذا كنت تستخدم واحدة)
DATABASE_URL=your-database-url

# إعدادات إضافية
NEXT_PUBLIC_APP_NAME=حاسبة موصبري
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### **2. إعدادات الشبكة (Network):**
في Railway Dashboard > Settings > Network:

```
Port: 3000
Protocol: HTTP
Internal Port: 3000
```

### **3. إعدادات البناء (Build):**
في Railway Dashboard > Settings > Build:

```
Build Command: npm run build
Start Command: npm start
Health Check Path: /api/health
Health Check Timeout: 300
```

### **4. إعدادات النشر (Deploy):**
في Railway Dashboard > Settings > Deploy:

```
Auto Deploy: Enabled
Branch: main
Restart Policy: On Failure
Max Retries: 10
```

### **5. إعدادات الموارد (Resources):**
في Railway Dashboard > Settings > Resources:

```
CPU: 0.5 vCPU (Free tier)
Memory: 1GB RAM (Free tier)
Storage: 1GB (Free tier)
```

### **6. إعدادات الأمان (Security):**
في Railway Dashboard > Settings > Security:

```
HTTPS: Enabled (Automatic)
SSL Certificate: Auto-generated
Security Headers: Enabled
```

### **7. إعدادات المراقبة (Monitoring):**
في Railway Dashboard > Settings > Monitoring:

```
Logs Retention: 7 days
Metrics Collection: Enabled
Error Tracking: Enabled
```

## 📊 **مراقبة الأداء:**

### **1. سجلات التطبيق (Logs):**
- اذهب إلى **Logs** tab
- راقب سجلات التطبيق
- ابحث عن الأخطاء

### **2. إحصائيات الأداء (Metrics):**
- اذهب إلى **Metrics** tab
- راقب استخدام CPU و RAM
- راقب عدد الطلبات

### **3. النشرات (Deployments):**
- اذهب إلى **Deployments** tab
- راقب حالة النشرات
- تحقق من وقت البناء

## 🔒 **إعدادات الأمان:**

### **1. متغيرات حساسة:**
- لا تضع كلمات المرور في الكود
- استخدم متغيرات البيئة
- احمِ المفاتيح السرية

### **2. HTTPS:**
- Railway يوفر HTTPS تلقائياً
- تأكد من تفعيله

### **3. Security Headers:**
- Railway يضيف headers أمان تلقائياً
- يمكنك تخصيصها في `next.config.js`

## 💰 **إدارة التكلفة:**

### **1. مراقبة الاستخدام:**
- اذهب إلى **Usage** tab
- راقب استهلاك الموارد
- تحقق من الفواتير

### **2. تحسين الأداء:**
- استخدم caching
- optimize images
- minimize bundle size

## 🆘 **استكشاف الأخطاء:**

### **1. سجلات الأخطاء:**
```bash
# في Railway Dashboard > Logs
# ابحث عن:
# - Build errors
# - Runtime errors
# - Memory errors
```

### **2. مشاكل شائعة:**
1. **Memory Issues**: زيادة RAM
2. **Build Timeout**: زيادة timeout
3. **Port Issues**: تأكد من المنفذ الصحيح

## 📋 **قائمة التحقق:**

- [ ] متغيرات البيئة
- [ ] إعدادات الشبكة
- [ ] إعدادات البناء
- [ ] إعدادات النشر
- [ ] إعدادات الموارد
- [ ] إعدادات الأمان
- [ ] إعدادات المراقبة
- [ ] مراقبة الأداء
- [ ] إدارة التكلفة

---

**🎯 بعد إكمال هذه الإعدادات، موقعك سيكون محسّن بالكامل!** 