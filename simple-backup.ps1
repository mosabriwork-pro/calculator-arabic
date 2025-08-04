# سكريبت النسخ الاحتياطي البسيط
$backupDate = Get-Date -Format "yyyy-MM-dd-HHmm"
$sourcePath = "C:\Users\talal\calculator-arabic"
$backupPath = "C:\Users\talal\calculator-arabic-backup-$backupDate"

Write-Host "=== بدء عملية النسخ الاحتياطي ===" -ForegroundColor Green
Write-Host "المصدر: $sourcePath" -ForegroundColor Yellow
Write-Host "الوجهة: $backupPath" -ForegroundColor Yellow

# إنشاء مجلد النسخة الاحتياطية
New-Item -ItemType Directory -Path $backupPath -Force
Write-Host "تم إنشاء مجلد النسخة الاحتياطية" -ForegroundColor Green

# نسخ جميع الملفات والمجلدات (باستثناء node_modules و .next و .git)
Write-Host "جاري نسخ الملفات..." -ForegroundColor Yellow
Get-ChildItem -Path $sourcePath -Exclude "node_modules", ".next", ".git" | Copy-Item -Destination $backupPath -Recurse -Force
Write-Host "تم نسخ جميع الملفات بنجاح" -ForegroundColor Green

# إنشاء ملف معلومات النسخة الاحتياطية
$backupInfo = @"
# معلومات النسخة الاحتياطية
تاريخ الإنشاء: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
المصدر: $sourcePath
الوجهة: $backupPath
نوع النسخة الاحتياطية: شاملة
المحتوى: النظام بالكامل مع جميع البيانات والملفات

## الملفات المهمة المضمنة:
- جميع ملفات المصدر (src/)
- ملفات البيانات (data/)
- ملفات التكوين (package.json, tsconfig.json, etc.)
- جميع الوثائق والتوثيق
- ملفات الإعداد والتكوين
- ملفات الصور والموارد (public/)

## استبعاد:
- node_modules (يمكن إعادة تثبيت)
- .next (مجلد البناء المؤقت)
- .git (مجلد Git)

## معلومات النظام:
- نظام إدارة العملاء
- نظام الحسابات والاشتراكات
- نظام إرسال البريد الإلكتروني
- نظام إدارة الرموز الدائمة
- واجهة الإدارة
- التقارير والطباعة

## للاستعادة:
1. نسخ محتويات المجلد إلى المسار الجديد
2. تشغيل: npm install
3. تشغيل: npm run dev
"@

$backupInfo | Out-File -FilePath "$backupPath\BACKUP_INFO.md" -Encoding UTF8
Write-Host "تم إنشاء ملف معلومات النسخة الاحتياطية" -ForegroundColor Green

# حساب حجم النسخة الاحتياطية
$size = (Get-ChildItem -Path $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($size / 1MB, 2)
Write-Host "حجم النسخة الاحتياطية: $sizeMB MB" -ForegroundColor Cyan

Write-Host "=== اكتملت عملية النسخ الاحتياطي ===" -ForegroundColor Green
Write-Host "تم إنشاء النسخة الاحتياطية الشاملة بنجاح في: $backupPath" -ForegroundColor Green 