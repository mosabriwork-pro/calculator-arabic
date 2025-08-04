#!/bin/bash

echo "🚀 رفع المشروع على GitHub..."

# التحقق من وجود git
if ! command -v git &> /dev/null; then
    echo "❌ Git غير مثبت. يرجى تثبيت Git أولاً."
    exit 1
fi

# تهيئة Git repository
if [ ! -d ".git" ]; then
    echo "📦 تهيئة Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Calculator Arabic App"
fi

# إضافة remote repository (استبدل YOUR_USERNAME باسم المستخدم)
echo "🔗 إضافة GitHub remote..."
echo "يرجى إدخال اسم المستخدم على GitHub:"
read github_username

git remote add origin https://github.com/$github_username/calculator-arabic.git

# رفع المشروع
echo "📤 رفع المشروع على GitHub..."
git branch -M main
git push -u origin main

echo "✅ تم رفع المشروع بنجاح على GitHub!"
echo "🔗 رابط المستودع: https://github.com/$github_username/calculator-arabic"
echo ""
echo "📋 الخطوات التالية:"
echo "1. اذهب إلى Railway.app"
echo "2. اربط حساب GitHub"
echo "3. اختر هذا المستودع"
echo "4. أضف الدومين mosabri.top" 