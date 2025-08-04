# سكريبت التحقق من النسخة الاحتياطية
# Backup Verification Script

param(
    [string]$BackupPath = ""
)

if ($BackupPath -eq "") {
    # البحث عن أحدث نسخة احتياطية
    $latestBackup = Get-ChildItem "C:\Users\talal\calculator-arabic-backup-*" | 
                   Sort-Object LastWriteTime -Descending | 
                   Select-Object -First 1
    
    if ($latestBackup) {
        $BackupPath = $latestBackup.FullName
    } else {
        Write-Host "خطأ: لم يتم العثور على نسخة احتياطية" -ForegroundColor Red
        exit 1
    }
}

Write-Host "=== التحقق من النسخة الاحتياطية ===" -ForegroundColor Green
Write-Host "المسار: $BackupPath" -ForegroundColor Yellow

# التحقق من وجود المجلد
if (-not (Test-Path $BackupPath)) {
    Write-Host "خطأ: مجلد النسخة الاحتياطية غير موجود" -ForegroundColor Red
    exit 1
}

# قائمة الملفات والمجلدات المهمة للتحقق منها
$criticalItems = @(
    "src",
    "data",
    "public",
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "tailwind.config.js",
    "README.md",
    "BACKUP_INSTRUCTIONS.md"
)

$missingItems = @()
$foundItems = @()

foreach ($item in $criticalItems) {
    $itemPath = Join-Path $BackupPath $item
    if (Test-Path $itemPath) {
        $foundItems += $item
        Write-Host "✓ $item" -ForegroundColor Green
    } else {
        $missingItems += $item
        Write-Host "✗ $item" -ForegroundColor Red
    }
}

# التحقق من ملفات البيانات
Write-Host "`n=== التحقق من ملفات البيانات ===" -ForegroundColor Cyan
$dataFiles = @("customers.json", "permanent-codes.json", "email-records.json")
$dataPath = Join-Path $BackupPath "data"

if (Test-Path $dataPath) {
    foreach ($file in $dataFiles) {
        $filePath = Join-Path $dataPath $file
        if (Test-Path $filePath) {
            $size = (Get-Item $filePath).Length
            Write-Host "✓ $file ($size bytes)" -ForegroundColor Green
        } else {
            Write-Host "✗ $file" -ForegroundColor Red
            $missingItems += "data/$file"
        }
    }
} else {
    Write-Host "✗ مجلد data غير موجود" -ForegroundColor Red
    $missingItems += "data"
}

# التحقق من ملفات المصدر
Write-Host "`n=== التحقق من ملفات المصدر ===" -ForegroundColor Cyan
$srcPath = Join-Path $BackupPath "src"
if (Test-Path $srcPath) {
    $srcFiles = Get-ChildItem -Path $srcPath -Recurse -File | Measure-Object
    Write-Host "✓ عدد ملفات المصدر: $($srcFiles.Count)" -ForegroundColor Green
    
    # التحقق من الملفات المهمة في src
    $importantSrcFiles = @(
        "src/app/page.tsx",
        "src/app/calculator/page.tsx",
        "src/app/admin/page.tsx",
        "src/app/api/customers/route.ts",
        "src/app/api/send-email/route.ts"
    )
    
    foreach ($file in $importantSrcFiles) {
        $filePath = Join-Path $BackupPath $file
        if (Test-Path $filePath) {
            Write-Host "✓ $file" -ForegroundColor Green
        } else {
            Write-Host "✗ $file" -ForegroundColor Red
            $missingItems += $file
        }
    }
} else {
    Write-Host "✗ مجلد src غير موجود" -ForegroundColor Red
    $missingItems += "src"
}

# حساب حجم النسخة الاحتياطية
Write-Host "`n=== معلومات الحجم ===" -ForegroundColor Cyan
try {
    $size = (Get-ChildItem -Path $BackupPath -Recurse | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($size / 1MB, 2)
    Write-Host "حجم النسخة الاحتياطية: $sizeMB MB" -ForegroundColor Green
} catch {
    Write-Host "لا يمكن حساب حجم النسخة الاحتياطية" -ForegroundColor Yellow
}

# التحقق من ملف معلومات النسخة الاحتياطية
Write-Host "`n=== التحقق من ملف المعلومات ===" -ForegroundColor Cyan
$infoFile = Join-Path $BackupPath "BACKUP_INFO.md"
if (Test-Path $infoFile) {
    Write-Host "✓ ملف معلومات النسخة الاحتياطية موجود" -ForegroundColor Green
    $info = Get-Content $infoFile -Head 5
    Write-Host "محتوى الملف:" -ForegroundColor Gray
    $info | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "✗ ملف معلومات النسخة الاحتياطية غير موجود" -ForegroundColor Red
    $missingItems += "BACKUP_INFO.md"
}

# ملخص النتائج
Write-Host "`n=== ملخص النتائج ===" -ForegroundColor Green
Write-Host "الملفات الموجودة: $($foundItems.Count)/$($criticalItems.Count)" -ForegroundColor Green
Write-Host "الملفات المفقودة: $($missingItems.Count)" -ForegroundColor $(if ($missingItems.Count -eq 0) { "Green" } else { "Red" })

if ($missingItems.Count -eq 0) {
    Write-Host "`n✓ النسخة الاحتياطية صحيحة ومكتملة!" -ForegroundColor Green
    Write-Host "يمكن استخدامها للاستعادة بأمان." -ForegroundColor Green
} else {
    Write-Host "`n⚠ تحذير: بعض الملفات مفقودة:" -ForegroundColor Yellow
    $missingItems | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "يُنصح بإنشاء نسخة احتياطية جديدة." -ForegroundColor Yellow
}

# اقتراحات للتحسين
Write-Host "`n=== اقتراحات للتحسين ===" -ForegroundColor Cyan
Write-Host "1. احتفظ بنسخة احتياطية في مكان آمن خارج الكمبيوتر" -ForegroundColor White
Write-Host "2. اختبر النسخة الاحتياطية في بيئة منفصلة" -ForegroundColor White
Write-Host "3. أنشئ نسخ احتياطية منتظمة (أسبوعياً أو شهرياً)" -ForegroundColor White
Write-Host "4. احتفظ بنسخة احتياطية من قاعدة البيانات بشكل منفصل" -ForegroundColor White 