# 🗄️ إعداد قاعدة البيانات في Railway

## 📋 **الخطوات:**

### **الخطوة 1: إضافة قاعدة البيانات**
1. اضغط **"Database"** في قائمة Add New Service
2. اختر **PostgreSQL**
3. انتظر حتى يتم إنشاء قاعدة البيانات

### **الخطوة 2: الحصول على رابط قاعدة البيانات**
1. اذهب إلى **Variables** tab
2. ستجد متغير `DATABASE_URL` تلقائياً
3. انسخ الرابط

### **الخطوة 3: إضافة المتغيرات**
```env
DATABASE_URL=postgresql://username:password@host:port/database
```

### **الخطوة 4: تثبيت مكتبة قاعدة البيانات**
```bash
npm install pg @types/pg
```

## 📊 **ما يمكن حفظه في قاعدة البيانات:**

### **1. بيانات العملاء:**
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **2. سجلات العمليات:**
```sql
CREATE TABLE operations (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  operation_type VARCHAR(50),
  result TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **3. الإحصائيات:**
```sql
CREATE TABLE statistics (
  id SERIAL PRIMARY KEY,
  date DATE,
  total_operations INTEGER,
  total_customers INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 **مثال على الاتصال بقاعدة البيانات:**

```javascript
// في src/app/api/database/route.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

export async function GET() {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    
    return Response.json({
      status: 'success',
      timestamp: result.rows[0].now
    })
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message
    }, { status: 500 })
  }
}
```

## 💰 **التكلفة:**
- **PostgreSQL**: $5/شهر (بعد الاستخدام المجاني)
- **Volume**: $0.25/GB/شهر

## 🎯 **التوصية:**

### **ابدأ بـ Database أولاً:**
1. أضف PostgreSQL
2. اختبر الاتصال
3. أضف الجداول الأساسية
4. اربطها بموقعك

### **ثم أضف Volume لاحقاً:**
- لحفظ الملفات
- للنسخ الاحتياطية

## 📊 **قائمة التحقق:**

- [ ] إضافة PostgreSQL
- [ ] الحصول على DATABASE_URL
- [ ] تثبيت مكتبة pg
- [ ] إنشاء الجداول
- [ ] ربط قاعدة البيانات بالموقع
- [ ] اختبار الاتصال

---

**💡 قاعدة البيانات ستجعل موقعك أكثر احترافية!** 