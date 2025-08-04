# 🚀 إعداد الدومين الجديد - mosabri.top

## ✅ تم تحديث الملفات التالية:

1. **next.config.js** - إضافة الدومين الجديد
2. **src/app/layout.tsx** - تحديث metadata
3. **vercel.json** - إعدادات Vercel
4. **public/robots.txt** - تحديث robots.txt
5. **public/sitemap.xml** - إنشاء sitemap
6. **public/_redirects** - إعداد redirects
7. **netlify.toml** - إعدادات Netlify
8. **DOMAIN_SETUP.md** - دليل مفصل
9. **deploy-domain.sh** - سكريبت النشر
10. **domain-test.js** - اختبار الدومين

## 🎯 الخطوات السريعة:

### 1. إعداد DNS (في لوحة تحكم الدومين):

**لـ Vercel:**
```
Type: A
Name: @
Value: 76.76.19.19

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**لـ منصات أخرى:**
```
Type: A
Name: @
Value: [IP الخادم]

Type: CNAME
Name: www
Value: [اسم الخادم]
```

### 2. إضافة الدومين في منصة الاستضافة:

**Vercel:**
- Settings > Domains > Add Domain: `mosabri.top`
- Add Domain: `www.mosabri.top`

**Netlify:**
- Site settings > Domain management > Add custom domain

### 3. النشر:

```bash
# تشغيل سكريبت النشر
chmod +x deploy-domain.sh
./deploy-domain.sh

# أو النشر اليدوي
npm run build
vercel --prod  # أو netlify deploy --prod
```

### 4. اختبار الدومين:

```bash
# تشغيل اختبار الدومين
node domain-test.js
```

## 🔧 إعدادات إضافية:

### متغيرات البيئة (إذا لزم الأمر):
```bash
NEXT_PUBLIC_DOMAIN=mosabri.top
NEXT_PUBLIC_SITE_URL=https://mosabri.top
```

### SSL Certificate:
- تأكد من تفعيل SSL في منصة الاستضافة
- قد يستغرق 24-48 ساعة لتفعيل الشهادة

## 📋 قائمة التحقق:

- [ ] إعداد DNS records
- [ ] إضافة الدومين في منصة الاستضافة
- [ ] تفعيل SSL
- [ ] نشر الموقع
- [ ] اختبار الدومين
- [ ] اختبار جميع الصفحات
- [ ] اختبار النماذج
- [ ] اختبار إرسال البريد الإلكتروني

## 🆘 استكشاف الأخطاء:

### إذا لم يعمل الدومين:
1. تحقق من إعدادات DNS
2. انتظر 24-48 ساعة لانتشار DNS
3. تحقق من إعدادات منصة الاستضافة

### إذا لم يعمل SSL:
1. تأكد من تفعيل SSL في منصة الاستضافة
2. انتظر تفعيل الشهادة
3. تحقق من إعدادات DNS

### إذا لم تعمل النماذج:
1. تحقق من إعدادات API
2. تحقق من متغيرات البيئة
3. تحقق من سجلات الأخطاء

## 📞 الدعم:

إذا واجهت أي مشاكل:
1. راجع `DOMAIN_SETUP.md` للتعليمات المفصلة
2. تحقق من وثائق منصة الاستضافة
3. راجع سجلات الأخطاء

---

**🎉 تهانينا! موقعك الآن جاهز على mosabri.top** 