const crypto = require('crypto');

// Your actual APP_SECRET
const APP_SECRET = '9f3a6b1d2e4c5a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef001122334455667788';

function generateAccessCode(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const hmac = crypto.createHmac('sha256', APP_SECRET);
  hmac.update(normalizedEmail);
  return hmac.digest('hex').substring(0, 8).toUpperCase();
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/generate-code.js <email>');
  console.log('Example: node scripts/generate-code.js user@example.com');
  process.exit(1);
}

const accessCode = generateAccessCode(email);
console.log(`\n📧 Email: ${email}`);
console.log(`🔑 Access Code: ${accessCode}`);
console.log(`\nSend this code to the user for login.\n`); 