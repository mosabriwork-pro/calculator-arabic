# سكريبت النسخ الاحتياطي الشامل للنظام
# Comprehensive Backup Script for the Calculator Arabic System

param(
    [string]$BackupType = "full",  # full, git, or zip
    [string]$CustomPath = ""
)

# إعدادات النسخ الاحتياطي
$backupDate = Get-Date -Format "yyyy-MM-dd-HHmm"
$sourcePath = "C:\Users\talal\calculator-arabic"

if ($CustomPath -ne "") {
    $backupPath = $CustomPath
} else {
    $backupPath = "C:\Users\talal\calculator-arabic-backup-$backupDate"
}

$zipPath = "C:\Users\talal\calculator-arabic-backup-$backupDate.zip"

Write-Host "=== بدء عملية النسخ الاحتياطي ===" -ForegroundColor Green
Write-Host "المصدر: $sourcePath" -ForegroundColor Yellow
Write-Host "التاريخ: $backupDate" -ForegroundColor Yellow

# التحقق من وجود المجلد المصدر
if (-not (Test-Path $sourcePath)) {
    Write-Host "خطأ: المجلد المصدر غير موجود: $sourcePath" -ForegroundColor Red
    exit 1
}

switch ($BackupType.ToLower()) {
    "full" {
        Write-Host "إنشاء نسخة احتياطية شاملة..." -ForegroundColor Cyan
        
        # إنشاء مجلد النسخة الاحتياطية
        try {
            New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
            Write-Host "تم إنشاء مجلد النسخة الاحتياطية: $backupPath" -ForegroundColor Green
        } catch {
            Write-Host "خطأ في إنشاء مجلد النسخة الاحتياطية: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
        
        # نسخ جميع الملفات والمجلدات (باستثناء node_modules و .next و .git)
        try {
            Write-Host "جاري نسخ الملفات..." -ForegroundColor Yellow
            Get-ChildItem -Path $sourcePath -Exclude "node_modules", ".next", ".git" | 
                Copy-Item -Destination $backupPath -Recurse -Force
            
            Write-Host "تم نسخ جميع الملفات بنجاح" -ForegroundColor Green
        } catch {
            Write-Host "خطأ في نسخ الملفات: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
        
        # نسخ ملفات البيانات المهمة بشكل منفصل للتأكد
        try {
            if (Test-Path "$sourcePath\data") {
                Copy-Item "$sourcePath\data\*" "$backupPath\data\" -Recurse -Force
                Write-Host "تم نسخ ملفات البيانات بنجاح" -ForegroundColor Green
            }
        } catch {
            Write-Host "تحذير: خطأ في نسخ ملفات البيانات: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
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

        try {
            $backupInfo | Out-File -FilePath "$backupPath\BACKUP_INFO.md" -Encoding UTF8
            Write-Host "تم إنشاء ملف معلومات النسخة الاحتياطية" -ForegroundColor Green
        } catch {
            Write-Host "تحذير: خطأ في إنشاء ملف المعلومات: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        # حساب حجم النسخة الاحتياطية
        try {
            $size = (Get-ChildItem -Path $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum
            $sizeMB = [math]::Round($size / 1MB, 2)
            Write-Host "حجم النسخة الاحتياطية: $sizeMB MB" -ForegroundColor Cyan
        } catch {
            Write-Host "تحذير: لا يمكن حساب حجم النسخة الاحتياطية" -ForegroundColor Yellow
        }
        
        Write-Host "تم إنشاء النسخة الاحتياطية الشاملة بنجاح في: $backupPath" -ForegroundColor Green
    }
    
    "git" {
        Write-Host "إنشاء نسخة احتياطية باستخدام Git..." -ForegroundColor Cyan
        
        # التحقق من وجود Git
        if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
            Write-Host "خطأ: Git غير مثبت أو غير متاح" -ForegroundColor Red
            exit 1
        }
        
        # حفظ التغييرات الحالية
        try {
            Set-Location $sourcePath
            git add .
            git commit -m "تحديث المشروع - $backupDate"
            Write-Host "تم حفظ التغييرات في Git" -ForegroundColor Green
        } catch {
            Write-Host "تحذير: خطأ في حفظ التغييرات في Git: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        # إنشاء نسخة احتياطية
        try {
            $gitBackupPath = "C:\Users\talal\calculator-arabic-backup-git-$backupDate"
            git clone . $gitBackupPath
            Write-Host "تم إنشاء النسخة الاحتياطية Git في: $gitBackupPath" -ForegroundColor Green
        } catch {
            Write-Host "خطأ في إنشاء النسخة الاحتياطية Git: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
    
    "zip" {
        Write-Host "إنشاء نسخة احتياطية مضغوطة..." -ForegroundColor Cyan
        
        try {
            # استبعاد المجلدات غير المطلوبة
            $exclude = @("node_modules", ".next", ".git")
            $files = Get-ChildItem -Path $sourcePath -Exclude $exclude
            
            Compress-Archive -Path $files.FullName -DestinationPath $zipPath -Force
            Write-Host "تم إنشاء النسخة الاحتياطية المضغوطة في: $zipPath" -ForegroundColor Green
            
            # حساب حجم الملف المضغوط
            $size = (Get-Item $zipPath).Length
            $sizeMB = [math]::Round($size / 1MB, 2)
            Write-Host "حجم الملف المضغوط: $sizeMB MB" -ForegroundColor Cyan
        } catch {
            Write-Host "خطأ في إنشاء النسخة الاحتياطية المضغوطة: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
    
    default {
        Write-Host "خطأ: نوع النسخة الاحتياطية غير صحيح. استخدم: full, git, أو zip" -ForegroundColor Red
        exit 1
    }
}

Write-Host "=== اكتملت عملية النسخ الاحتياطي ===" -ForegroundColor Green
Write-Host "تاريخ النسخة الاحتياطية: $backupDate" -ForegroundColor Yellow

# عرض معلومات إضافية
Write-Host "`n=== معلومات إضافية ===" -ForegroundColor Cyan
Write-Host "للتحقق من النسخ الاحتياطية الموجودة:" -ForegroundColor White
Write-Host "Get-ChildItem 'C:\Users\talal\calculator-arabic-backup-*' | Select-Object Name, Length, LastWriteTime" -ForegroundColor Gray

Write-Host "`nللحصول على المساعدة:" -ForegroundColor White
Write-Host ".\create-backup.ps1 -BackupType full    # نسخة احتياطية شاملة" -ForegroundColor Gray
Write-Host ".\create-backup.ps1 -BackupType git     # نسخة احتياطية Git" -ForegroundColor Gray
Write-Host ".\create-backup.ps1 -BackupType zip     # نسخة احتياطية مضغوطة" -ForegroundColor Gray 