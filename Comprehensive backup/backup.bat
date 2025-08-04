@echo off
chcp 65001 >nul
echo ========================================
echo    سكريبت النسخ الاحتياطي للنظام
echo    Calculator Arabic Backup Script
echo ========================================
echo.

echo اختر نوع النسخة الاحتياطية:
echo 1. نسخة احتياطية شاملة (الأفضل)
echo 2. نسخة احتياطية Git
echo 3. نسخة احتياطية مضغوطة
echo.

set /p choice="أدخل رقم الخيار (1-3): "

if "%choice%"=="1" (
    echo.
    echo إنشاء نسخة احتياطية شاملة...
    powershell -ExecutionPolicy Bypass -File "create-backup.ps1" -BackupType full
) else if "%choice%"=="2" (
    echo.
    echo إنشاء نسخة احتياطية Git...
    powershell -ExecutionPolicy Bypass -File "create-backup.ps1" -BackupType git
) else if "%choice%"=="3" (
    echo.
    echo إنشاء نسخة احتياطية مضغوطة...
    powershell -ExecutionPolicy Bypass -File "create-backup.ps1" -BackupType zip
) else (
    echo.
    echo خيار غير صحيح!
    echo.
    echo للنسخة الاحتياطية الشاملة:
    powershell -ExecutionPolicy Bypass -File "create-backup.ps1" -BackupType full
    echo.
    echo للنسخة الاحتياطية Git:
    powershell -ExecutionPolicy Bypass -File "create-backup.ps1" -BackupType git
    echo.
    echo للنسخة الاحتياطية المضغوطة:
    powershell -ExecutionPolicy Bypass -File "create-backup.ps1" -BackupType zip
)

echo.
echo اضغط أي مفتاح للخروج...
pause >nul 