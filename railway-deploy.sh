#!/bin/bash

echo "🚀 نشر المشروع على Railway..."

# التحقق من وجود git
if ! command -v git &> /dev/null; then
    echo "❌ Git غير مثبت. يرجى تثبيت Git أولاً."
    exit 1
fi

# التحقق من وجود Railway CLI
if ! command -v railway &> /dev/null; then
    echo "📦 تثبيت Railway CLI..."
    npm install -g @railway/cli
fi

# تسجيل الدخول إلى Railway
echo "🔐 تسجيل الدخول إلى Railway..."
railway login

# إضافة جميع الملفات
echo "📦 إضافة الملفات..."
git add .

# عمل commit
echo "💾 حفظ التغييرات..."
git commit -m "Deploy to Railway - $(date)"

# رفع على GitHub
echo "📤 رفع على GitHub..."
git push origin main

# نشر على Railway
echo "🚀 نشر على Railway..."
railway up

echo "✅ تم النشر بنجاح!"
echo ""
echo "📋 الخطوات التالية:"
echo "1. اذهب إلى Railway Dashboard"
echo "2. أضف الدومين mosabri.top"
echo "3. إعداد DNS records"
echo "4. اختبار الموقع" 