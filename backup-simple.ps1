# Simple Backup Script
$backupDate = Get-Date -Format "yyyy-MM-dd-HHmm"
$sourcePath = "C:\Users\talal\calculator-arabic"
$backupPath = "C:\Users\talal\calculator-arabic-backup-$backupDate"

Write-Host "=== Starting Backup Process ===" -ForegroundColor Green
Write-Host "Source: $sourcePath" -ForegroundColor Yellow
Write-Host "Destination: $backupPath" -ForegroundColor Yellow

# Create backup directory
New-Item -ItemType Directory -Path $backupPath -Force
Write-Host "Backup directory created" -ForegroundColor Green

# Copy all files and folders (excluding node_modules, .next, .git)
Write-Host "Copying files..." -ForegroundColor Yellow
Get-ChildItem -Path $sourcePath -Exclude "node_modules", ".next", ".git" | Copy-Item -Destination $backupPath -Recurse -Force
Write-Host "All files copied successfully" -ForegroundColor Green

# Create backup info file
$backupInfo = @"
# Backup Information
Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Source: $sourcePath
Destination: $backupPath
Type: Full System Backup
Content: Complete system with all data and files

## Important Files Included:
- All source files (src/)
- Data files (data/)
- Configuration files (package.json, tsconfig.json, etc.)
- All documentation
- Setup and configuration files
- Image and resource files (public/)

## Excluded:
- node_modules (can be reinstalled)
- .next (temporary build folder)
- .git (Git folder)

## System Information:
- Customer management system
- Account and subscription system
- Email sending system
- Permanent codes management
- Admin interface
- Reports and printing

## For Restoration:
1. Copy folder contents to new location
2. Run: npm install
3. Run: npm run dev
"@

$backupInfo | Out-File -FilePath "$backupPath\BACKUP_INFO.md" -Encoding UTF8
Write-Host "Backup info file created" -ForegroundColor Green

# Calculate backup size
$size = (Get-ChildItem -Path $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($size / 1MB, 2)
Write-Host "Backup size: $sizeMB MB" -ForegroundColor Cyan

Write-Host "=== Backup Completed ===" -ForegroundColor Green
Write-Host "Full backup created successfully at: $backupPath" -ForegroundColor Green 