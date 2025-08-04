const nodemailer = require('nodemailer');

async function testGmailConnection() {
  console.log('🧪 اختبار إعدادات Gmail...\n');
  
  // Check environment variables
  const emailUser = process.env.EMAIL_USER || 'mosabriwork@gmail.com';
  const emailPass = process.env.EMAIL_PASS || 'temu eylb aqys faba';
  
  console.log('📧 البريد الإلكتروني:', emailUser);
  console.log('🔐 كلمة المرور:', emailPass.replace(/./g, '*'));
  console.log('');
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    },
    secure: true,
    port: 465,
    tls: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔍 التحقق من الاتصال...');
    await transporter.verify();
    console.log('✅ تم التحقق من الاتصال بنجاح!');
    
    console.log('\n📤 اختبار إرسال بريد إلكتروني...');
    const mailOptions = {
      from: `"اختبار" <${emailUser}>`,
      to: emailUser, // Send to yourself for testing
      subject: '🧪 اختبار إعدادات Gmail - حاسبة موصبري',
      html: `
        <h2>مرحباً!</h2>
        <p>هذا اختبار لإعدادات Gmail في حاسبة موصبري.</p>
        <p>إذا وصلت هذه الرسالة، فالإعدادات صحيحة! ✅</p>
        <p>الوقت: ${new Date().toLocaleString('ar-SA')}</p>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ تم إرسال البريد الإلكتروني بنجاح!');
    console.log('📨 معرف الرسالة:', info.messageId);
    
  } catch (error) {
    console.log('❌ فشل في الاتصال أو الإرسال:');
    console.log('رمز الخطأ:', error.code);
    console.log('الرسالة:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 الحلول المقترحة:');
      console.log('1. تأكد من تفعيل "التحقق بخطوتين" في Gmail');
      console.log('2. تأكد من صحة كلمة مرور التطبيقات');
      console.log('3. انتظر 5-10 دقائق بعد إنشاء كلمة مرور التطبيقات');
      console.log('4. تحقق من إعدادات الأمان في Gmail');
    }
  }
}

// Run test
testGmailConnection().catch(console.error); 