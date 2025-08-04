# ⚙️ إعدادات Railway الإضافية

## 🔧 الإعدادات المطلوبة:

### **1. إعدادات البناء (Build Settings):**
في Railway Dashboard > Settings > Build:

```
Build Command: npm run build
Start Command: npm start
Health Check Path: /
Health Check Timeout: 100
```

### **2. إعدادات الشبكة (Network):**
في Railway Dashboard > Settings > Network:

```
Port: 3000
Protocol: HTTP
```

### **3. إعدادات الدومين (Domains):**
في Railway Dashboard > Settings > Domains:

```
Primary Domain: mosabri.top
Additional Domains: www.mosabri.top
```

### **4. إعدادات البيئة (Environment):**
في Railway Dashboard > Settings > Environment:

```
Node Version: 18.x
NPM Version: Latest
```

## 📊 مراقبة الأداء:

### **1. سجلات التطبيق (Logs):**
- اذهب إلى **Logs** tab
- راقب سجلات البناء والنشر
- ابحث عن أي أخطاء

### **2. إحصائيات الأداء (Metrics):**
- اذهب إلى **Metrics** tab
- راقب استخدام CPU و RAM
- راقب عدد الطلبات

### **3. النشرات (Deployments):**
- اذهب إلى **Deployments** tab
- راقب حالة النشر
- تحقق من وقت البناء

## 🔒 إعدادات الأمان:

### **1. متغيرات البيئة الحساسة:**
تأكد من أن هذه المتغيرات موجودة:
```env
NODE_ENV=production
CUSTOM_KEY=[your-secret-key]
```

### **2. إعدادات SSL:**
- Railway يوفر SSL تلقائياً
- تأكد من تفعيل HTTPS

## 🚀 إعدادات النشر:

### **1. النشر التلقائي:**
- Railway ينشر تلقائياً عند كل push إلى GitHub
- يمكنك تفعيل/إلغاء النشر التلقائي

### **2. النشر اليدوي:**
```bash
# في Terminal
railway up
```

## 📋 قائمة التحقق:

### ✅ الإعدادات الأساسية:
- [ ] متغيرات البيئة
- [ ] إعدادات البناء
- [ ] إعدادات الشبكة
- [ ] إعدادات الدومين

### ✅ مراقبة الأداء:
- [ ] سجلات التطبيق
- [ ] إحصائيات الأداء
- [ ] مراقبة النشرات

### ✅ الأمان:
- [ ] متغيرات البيئة الحساسة
- [ ] إعدادات SSL
- [ ] حماية البيانات

## 🆘 استكشاف الأخطاء:

### **مشاكل شائعة:**
1. **Build Failed**: تحقق من `package.json` و `nixpacks.toml`
2. **Port Issues**: تأكد من `PORT=3000`
3. **Domain Issues**: تحقق من إعدادات DNS
4. **Memory Issues**: راقب استخدام RAM

### **سجلات الأخطاء:**
```bash
# في Railway Dashboard > Logs
# ابحث عن:
# - Build errors
# - Runtime errors
# - Network errors
```

## 💰 إدارة التكلفة:

### **مراقبة الاستخدام:**
- اذهب إلى **Usage** tab
- راقب استهلاك الموارد
- تحقق من الفواتير

### **تحسين الأداء:**
- استخدم caching
- optimize images
- minimize bundle size

---

**🎯 بعد إكمال هذه الإعدادات، موقعك سيكون جاهزاً بالكامل!** 