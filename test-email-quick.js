const nodemailer = require('nodemailer');

async function testEmailQuick() {
  console.log('🧪 اختبار سريع للبريد الإلكتروني...\n');
  
  // إعدادات البريد الإلكتروني
  const emailUser = 'mosabrihelp@gmail.com';
  const emailPass = 'wukm xbaz eszx qetb';
  
  console.log('📧 البريد الإلكتروني:', emailUser);
  console.log('🔐 كلمة المرور:', emailPass.replace(/./g, '*'));
  console.log('');
  
  // إنشاء transporter
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    },
    // إعدادات محسنة
    secure: false,
    port: 587,
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    // إعدادات الاتصال
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10,
    socketTimeout: 30000,
    connectionTimeout: 30000,
    greetingTimeout: 30000
  });
  
  try {
    console.log('🔍 التحقق من الاتصال...');
    await transporter.verify();
    console.log('✅ تم التحقق من الاتصال بنجاح!');
    
    console.log('\n📤 اختبار إرسال بريد إلكتروني...');
    const mailOptions = {
      from: `"اختبار موصبري" <${emailUser}>`,
      to: emailUser, // إرسال لنفسك للاختبار
      subject: '🧪 اختبار البريد الإلكتروني - حاسبة موصبري',
      html: `
        <div style="
          background: linear-gradient(135deg, #1a472a 0%, #0f2e1a 100%);
          color: white;
          padding: 40px;
          text-align: center;
          font-family: Arial, sans-serif;
        ">
          <h1>🧪 اختبار البريد الإلكتروني</h1>
          <p>إذا وصلت هذه الرسالة، فإعدادات البريد الإلكتروني صحيحة! ✅</p>
          <p>الوقت: ${new Date().toLocaleString('ar-SA')}</p>
          <p>النظام: حاسبة موصبري برو</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ تم إرسال البريد الإلكتروني بنجاح!');
    console.log('📨 معرف الرسالة:', info.messageId);
    console.log('📧 من:', info.from);
    console.log('📤 إلى:', info.to);
    
    console.log('\n🎉 النظام يعمل بشكل مثالي!');
    
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
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 الحلول المقترحة:');
      console.log('1. تحقق من الاتصال بالإنترنت');
      console.log('2. تحقق من إعدادات Gmail');
      console.log('3. جرب استخدام مزود بريد إلكتروني مختلف');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 الحلول المقترحة:');
      console.log('1. تحقق من سرعة الإنترنت');
      console.log('2. انتظر قليلاً وحاول مرة أخرى');
      console.log('3. تحقق من إعدادات Firewall');
    }
  }
}

// تشغيل الاختبار
testEmailQuick().catch(console.error);
