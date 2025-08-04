# تعليمات النسخ الاحتياطي

## النسخ الاحتياطي الحالي
تم إنشاء نسخة احتياطية في: `C:\Users\talal\calculator-arabic-backup`

## كيفية عمل نسخة احتياطية جديدة

### الطريقة الأولى: النسخ الاحتياطي الشامل (الأفضل)
```bash
# إنشاء نسخة احتياطية شاملة مع التاريخ
$backupDate = Get-Date -Format "yyyy-MM-dd-HHmm"
$sourcePath = "C:\Users\talal\calculator-arabic"
$backupPath = "C:\Users\talal\calculator-arabic-backup-$backupDate"

# إنشاء مجلد النسخة الاحتياطية
New-Item -ItemType Directory -Path $backupPath -Force

# نسخ جميع الملفات والمجلدات (باستثناء node_modules و .next)
Get-ChildItem -Path $sourcePath -Exclude "node_modules", ".next", ".git" | Copy-Item -Destination $backupPath -Recurse -Force

# نسخ ملفات البيانات المهمة بشكل منفصل للتأكد
Copy-Item "$sourcePath\data\*" "$backupPath\data\" -Recurse -Force

# إنشاء ملف معلومات النسخة الاحتياطية
$backupInfo = @"
# معلومات النسخة الاحتياطية
تاريخ الإنشاء: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
المصدر: $sourcePath
الوجهة: $backupPath
المحتوى: النظام بالكامل مع جميع البيانات والملفات

## الملفات المهمة المضمنة:
- جميع ملفات المصدر (src/)
- ملفات البيانات (data/)
- ملفات التكوين (package.json, tsconfig.json, etc.)
- جميع الوثائق والتوثيق
- ملفات الإعداد والتكوين

## استبعاد:
- node_modules (يمكن إعادة تثبيت)
- .next (مجلد البناء المؤقت)
- .git (مجلد Git)

"@

$backupInfo | Out-File -FilePath "$backupPath\BACKUP_INFO.md" -Encoding UTF8

Write-Host "تم إنشاء النسخة الاحتياطية بنجاح في: $backupPath"
```

### الطريقة الثانية: باستخدام Git (للنسخ الاحتياطية المتقدمة)
```bash
# حفظ التغييرات الحالية
git add .
git commit -m "تحديث المشروع - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

# إنشاء نسخة احتياطية جديدة
git clone . ../calculator-arabic-backup-$(Get-Date -Format "yyyy-MM-dd")
```

### الطريقة الثالثة: ضغط المجلد
```bash
# ضغط المجلد كاملاً
$backupDate = Get-Date -Format "yyyy-MM-dd-HHmm"
$sourcePath = "C:\Users\talal\calculator-arabic"
$zipPath = "C:\Users\talal\calculator-arabic-backup-$backupDate.zip"

# استبعاد المجلدات غير المطلوبة
$exclude = @("node_modules", ".next", ".git")
$files = Get-ChildItem -Path $sourcePath -Exclude $exclude

Compress-Archive -Path $files.FullName -DestinationPath $zipPath -Force
Write-Host "تم إنشاء النسخة الاحتياطية المضغوطة في: $zipPath"
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

### التحقق من حجم النسخة الاحتياطية
```bash
Get-ChildItem "C:\Users\talal\calculator-arabic-backup-*" | Select-Object Name, Length, LastWriteTime
```

## نصائح مهمة

1. **احفظ التغييرات قبل عمل نسخة احتياطية**
2. **استخدم تواريخ في أسماء النسخ الاحتياطية**
3. **احتفظ بالنسخ الاحتياطية في مكان آمن**
4. **اختبر النسخة الاحتياطية بعد إنشائها**
5. **تحقق من تضمين ملفات البيانات المهمة**
6. **احتفظ بنسخة احتياطية من قاعدة البيانات**

## استعادة من نسخة احتياطية

### من النسخة الاحتياطية الشاملة
```bash
$backupPath = "C:\Users\talal\calculator-arabic-backup-[DATE]"
$restorePath = "C:\Users\talal\calculator-arabic"

# نسخ من النسخة الاحتياطية
Copy-Item "$backupPath\*" $restorePath -Recurse -Force

# إعادة تثبيت التبعيات
npm install
```

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
تم تحديث هذا الملف في: $(Get-Date -Format 'yyyy-MM-dd HH:mm') 