const crypto = require('crypto');

const APP_SECRET = '9f3a6b1d2e4c5a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef001122334455667788';

function generateAccessCode(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const hmac = crypto.createHmac('sha256', APP_SECRET);
  hmac.update(normalizedEmail);
  return hmac.digest('hex').substring(0, 8).toUpperCase();
}

// استبدل هذا البريد الإلكتروني ببريدك
const email = process.argv[2] || 'example@email.com';

if (!process.argv[2]) {
  console.log('⚠️  لم يتم تحديد بريد إلكتروني');
  console.log('💡 الاستخدام: node generate-code.js your-email@example.com');
  console.log('');
}

const accessCode = generateAccessCode(email);
console.log('📧 البريد الإلكتروني:', email);
console.log('🔐 رمز الوصول:', accessCode);
console.log('');
console.log('✅ يمكنك الآن استخدام هذا الرمز للدخول إلى الحاسبة!'); 