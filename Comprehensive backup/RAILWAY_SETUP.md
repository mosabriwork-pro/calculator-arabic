# 🚀 إعداد المشروع على GitHub + Railway

## 📋 الخطوات الكاملة:

### **الخطوة 1: رفع المشروع على GitHub**

#### 1.1 إنشاء مستودع GitHub:
1. اذهب إلى [github.com](https://github.com)
2. اضغط "New repository"
3. اسم المستودع: `calculator-arabic`
4. اختر Public أو Private
5. **لا** تضع README (لأن المشروع موجود)

#### 1.2 رفع المشروع:
```bash
# في مجلد المشروع
git init
git add .
git commit -m "Initial commit - Calculator Arabic App"

# إضافة remote (استبدل YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/calculator-arabic.git
git branch -M main
git push -u origin main
```

### **الخطوة 2: إعداد Railway**

#### 2.1 إنشاء حساب Railway:
1. اذهب إلى [railway.app](https://railway.app)
2. سجل حساب جديد
3. اربط حساب GitHub

#### 2.2 إنشاء مشروع جديد:
1. اضغط "New Project"
2. اختر "Deploy from GitHub repo"
3. اختر مستودع `calculator-arabic`

#### 2.3 إعداد المتغيرات البيئية:
في Railway Dashboard > Variables:
```
NODE_ENV=production
NEXT_PUBLIC_DOMAIN=mosabri.top
NEXT_PUBLIC_SITE_URL=https://mosabri.top
```

### **الخطوة 3: إعداد الدومين**

#### 3.1 إضافة الدومين في Railway:
1. اذهب إلى Settings > Domains
2. أضف: `mosabri.top`
3. أضف: `www.mosabri.top`

#### 3.2 إعداد DNS:
في لوحة تحكم الدومين:
```
Type: A
Name: @
Value: [IP Railway] (سيظهر في Railway)

Type: CNAME
Name: www
Value: [Railway Domain]
```

### **الخطوة 4: النشر**

#### 4.1 النشر التلقائي:
- Railway سينشر تلقائياً عند كل push إلى GitHub
- يمكنك مراقبة النشر في Railway Dashboard

#### 4.2 النشر اليدوي:
```bash
# تحديث الكود
git add .
git commit -m "Update for Railway deployment"
git push origin main
```

## 🔧 ملفات الإعداد المطلوبة:

### ✅ تم إنشاؤها:
- `railway.json` - إعدادات Railway
- `nixpacks.toml` - إعدادات البناء
- `Procfile` - أمر التشغيل
- `.gitignore` - ملفات مستبعدة

## 📊 مراقبة الأداء:

### في Railway Dashboard:
- **Deployments** - مراقبة النشر
- **Logs** - سجلات التطبيق
- **Metrics** - إحصائيات الأداء
- **Variables** - متغيرات البيئة

## 🆘 استكشاف الأخطاء:

### مشاكل شائعة:
1. **Build Failed**: تحقق من `package.json` و `nixpacks.toml`
2. **Port Issues**: تأكد من أن التطبيق يعمل على PORT من Railway
3. **Environment Variables**: تحقق من إعداد المتغيرات

### سجلات الأخطاء:
```bash
# في Railway Dashboard > Logs
# أو في Terminal
railway logs
```

## 💰 التكلفة:

### Railway Pricing:
- **Free Tier**: $5 credit شهرياً
- **Paid Plans**: حسب الاستخدام
- **Custom Domain**: مجاني

## 🎯 الخطوات السريعة:

1. **رفع على GitHub** ✅
2. **إنشاء مشروع Railway** ✅
3. **إضافة الدومين** ✅
4. **إعداد DNS** ✅
5. **النشر** ✅

## 📞 الدعم:

- [Railway Documentation](https://docs.railway.app/)
- [GitHub Guides](https://guides.github.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**🎉 تهانينا! موقعك جاهز على Railway مع الدومين mosabri.top** 