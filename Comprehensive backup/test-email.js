const crypto = require('crypto');

// Test email functionality
async function testEmailSystem() {
  console.log('🧪 اختبار نظام البريد الإلكتروني - حاسبة موصبري\n');
  
  // Test access code generation
  const testEmail = 'test@example.com';
  const APP_SECRET = '9f3a6b1d2e4c5a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef001122334455667788';
  
  function generateAccessCode(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const hmac = crypto.createHmac('sha256', APP_SECRET);
    hmac.update(normalizedEmail);
    return hmac.digest('hex').substring(0, 8).toUpperCase();
  }
  
  const accessCode = generateAccessCode(testEmail);
  
  console.log('📧 البريد الإلكتروني التجريبي:', testEmail);
  console.log('🔐 رمز الوصول المولد:', accessCode);
  console.log('');
  
  // Test API endpoint
  console.log('🌐 اختبار API endpoint...');
  try {
    const response = await fetch('http://localhost:3003/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ تم إرسال البريد الإلكتروني بنجاح!');
      console.log('📨 الرسالة:', data.message);
      console.log('🔐 رمز الوصول:', data.accessCode);
    } else {
      console.log('❌ فشل في إرسال البريد الإلكتروني');
      console.log('🚨 الخطأ:', data.error);
    }
  } catch (error) {
    console.log('❌ خطأ في الاتصال بالخادم');
    console.log('💡 تأكد من تشغيل السيرفر: npm run dev');
  }
  
  console.log('\n📋 تعليمات الإعداد:');
  console.log('1. اقرأ ملف EMAIL_SETUP.md');
  console.log('2. أضف بيانات Gmail في ملف .env.local');
  console.log('3. شغل السيرفر: npm run dev');
  console.log('4. اذهب إلى: http://localhost:3003/send-email');
}

// Run test if this file is executed directly
if (require.main === module) {
  testEmailSystem().catch(console.error);
}

module.exports = { testEmailSystem }; 