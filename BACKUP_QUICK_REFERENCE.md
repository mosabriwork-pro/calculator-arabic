# دليل النسخ الاحتياطي السريع
# Quick Backup Reference Guide

## الطرق السريعة لإنشاء نسخة احتياطية

### 1. النسخ الاحتياطي الشامل (الأفضل)
```bash
# تشغيل السكريبت التفاعلي
backup.bat

# أو مباشرة
powershell -ExecutionPolicy Bypass -File "create-backup.ps1" -BackupType full
```

### 2. النسخ الاحتياطي المضغوط
```bash
powershell -ExecutionPolicy Bypass -File "create-backup.ps1" -BackupType zip
```

### 3. النسخ الاحتياطي Git
```bash
powershell -ExecutionPolicy Bypass -File "create-backup.ps1" -BackupType git
```

## التحقق من النسخة الاحتياطية
```bash
powershell -ExecutionPolicy Bypass -File "verify-backup.ps1"
```

## الأوامر المفيدة

### عرض النسخ الاحتياطية الموجودة
```bash
Get-ChildItem "C:\Users\talal\calculator-arabic-backup-*" | Select-Object Name, Length, LastWriteTime
```

### حذف النسخ الاحتياطية القديمة
```bash
# حذف النسخ الاحتياطية الأقدم من 30 يوماً
Get-ChildItem "C:\Users\talal\calculator-arabic-backup-*" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Recurse -Force
```

### نسخ نسخة احتياطية إلى مكان آخر
```bash
$backupPath = "C:\Users\talal\calculator-arabic-backup-[DATE]"
$destination = "D:\Backups\calculator-arabic"
Copy-Item $backupPath $destination -Recurse -Force
```

## استعادة من نسخة احتياطية

### استعادة كاملة
```bash
$backupPath = "C:\Users\talal\calculator-arabic-backup-[DATE]"
$restorePath = "C:\Users\talal\calculator-arabic"

# حذف المجلد الحالي (إذا كان موجوداً)
if (Test-Path $restorePath) {
    Remove-Item $restorePath -Recurse -Force
}

# نسخ من النسخة الاحتياطية
Copy-Item $backupPath $restorePath -Recurse -Force

# إعادة تثبيت التبعيات
Set-Location $restorePath
npm install
```

### استعادة ملفات محددة
```bash
$backupPath = "C:\Users\talal\calculator-arabic-backup-[DATE]"
$restorePath = "C:\Users\talal\calculator-arabic"

# استعادة ملفات البيانات فقط
Copy-Item "$backupPath\data\*" "$restorePath\data\" -Recurse -Force

# استعادة ملف معين
Copy-Item "$backupPath\src\app\calculator\page.tsx" "$restorePath\src\app\calculator\page.tsx" -Force
```

## جدول النسخ الاحتياطية الموصى به

| النوع | التكرار | الوصف |
|-------|---------|-------|
| شاملة | أسبوعياً | نسخة كاملة من النظام |
| مضغوطة | شهرياً | نسخة مضغوطة للتخزين طويل المدى |
| Git | عند كل تحديث مهم | نسخة مع تاريخ التغييرات |

## نصائح مهمة

1. **احتفظ بنسخة احتياطية قبل أي تحديث كبير**
2. **اختبر النسخة الاحتياطية في بيئة منفصلة**
3. **احتفظ بنسخة احتياطية في مكان آمن خارج الكمبيوتر**
4. **احتفظ بنسخة احتياطية من قاعدة البيانات بشكل منفصل**
5. **استخدم تواريخ واضحة في أسماء النسخ الاحتياطية**

## استكشاف الأخطاء

### مشكلة: لا يمكن إنشاء النسخة الاحتياطية
```bash
# التحقق من الصلاحيات
Get-Acl "C:\Users\talal\calculator-arabic"

# التحقق من المساحة المتاحة
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, FreeSpace, Size
```

### مشكلة: ملفات مفقودة في النسخة الاحتياطية
```bash
# التحقق من النسخة الاحتياطية
powershell -ExecutionPolicy Bypass -File "verify-backup.ps1"

# إنشاء نسخة احتياطية جديدة
powershell -ExecutionPolicy Bypass -File "create-backup.ps1" -BackupType full
```

### مشكلة: لا يمكن استعادة النسخة الاحتياطية
```bash
# التحقق من سلامة الملفات
Get-ChildItem "C:\Users\talal\calculator-arabic-backup-[DATE]" -Recurse | Test-Path

# محاولة استعادة تدريجية
Copy-Item "$backupPath\package.json" "$restorePath\package.json" -Force
npm install
```

## معلومات الاتصال

في حالة وجود مشاكل في النسخ الاحتياطي، راجع:
- `BACKUP_INSTRUCTIONS.md` - التعليمات التفصيلية
- `create-backup.ps1` - سكريبت النسخ الاحتياطي
- `verify-backup.ps1` - سكريبت التحقق 