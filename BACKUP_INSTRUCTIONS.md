# تعليمات النسخ الاحتياطي

## النسخ الاحتياطي الحالي
تم إنشاء نسخة احتياطية في: `C:\Users\talal\calculator-arabic-backup`

## كيفية عمل نسخة احتياطية جديدة

### الطريقة الأولى: باستخدام Git (الأفضل)
```bash
# حفظ التغييرات الحالية
git add .
git commit -m "تحديث المشروع - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

# إنشاء نسخة احتياطية جديدة
git clone . ../calculator-arabic-backup-$(Get-Date -Format "yyyy-MM-dd")
```

### الطريقة الثانية: نسخ يدوي
```bash
# نسخ المجلد بالكامل
xcopy "C:\Users\talal\calculator-arabic" "C:\Users\talal\calculator-arabic-backup-$(Get-Date -Format 'yyyy-MM-dd')" /E /I /H
```

### الطريقة الثالثة: ضغط المجلد
```bash
# ضغط المجلد كاملاً
powershell Compress-Archive -Path "C:\Users\talal\calculator-arabic" -DestinationPath "C:\Users\talal\calculator-arabic-backup-$(Get-Date -Format 'yyyy-MM-dd').zip"
```

## الأوامر المفيدة

### عرض حالة الملفات
```bash
git status
```

### عرض تاريخ التغييرات
```bash
git log --oneline
```

### العودة لنسخة سابقة
```bash
git checkout [commit-hash]
```

### عرض التغييرات في ملف معين
```bash
git diff [filename]
```

## نصائح مهمة

1. **احفظ التغييرات قبل عمل نسخة احتياطية**
2. **استخدم تواريخ في أسماء النسخ الاحتياطية**
3. **احتفظ بالنسخ الاحتياطية في مكان آمن**
4. **اختبر النسخة الاحتياطية بعد إنشائها**

## استعادة من نسخة احتياطية

### من Git
```bash
# العودة لنسخة معينة
git checkout [commit-hash]

# أو استعادة ملف معين
git checkout [commit-hash] -- [filename]
```

### من نسخة احتياطية يدوية
```bash
# نسخ من النسخة الاحتياطية
xcopy "C:\Users\talal\calculator-arabic-backup" "C:\Users\talal\calculator-arabic" /E /I /H
```

## آخر تحديث
تم إنشاء هذا الملف في: $(Get-Date -Format 'yyyy-MM-dd HH:mm') 