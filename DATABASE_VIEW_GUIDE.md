# 🔍 دليل رؤية قاعدة البيانات والجداول

## 🖥️ **الطريقة 1: من Railway Dashboard**

### **الخطوات:**
1. اذهب إلى [railway.app](https://railway.app)
2. اختر مشروعك
3. اضغط على **قاعدة البيانات PostgreSQL**
4. اذهب إلى **Connect** tab
5. ستجد **Railway CLI** أو **Connection URL**

### **استخدام Railway CLI:**
```bash
# تثبيت Railway CLI
npm install -g @railway/cli

# تسجيل الدخول
railway login

# الاتصال بقاعدة البيانات
railway connect
```

## 🌐 **الطريقة 2: من خلال الموقع (الأسهل)**

### **1. عرض معلومات قاعدة البيانات:**
اذهب إلى:
```
https://mosabri.top/api/database
```

ستجد:
- حالة الاتصال
- إصدار قاعدة البيانات
- عدد العملاء والعمليات
- الجداول الموجودة

### **2. عرض جميع المتغيرات:**
اذهب إلى:
```
https://mosabri.top/api/test-env
```

ستجد:
- جميع متغيرات البيئة
- حالة قاعدة البيانات

## 🔧 **الطريقة 3: إنشاء API لعرض الجداول**

### **إنشاء API لعرض محتوى الجداول:**
```javascript
// في src/app/api/database/tables/route.ts
export async function GET() {
  try {
    const client = await pool.connect()
    
    // عرض جميع العملاء
    const customers = await client.query('SELECT * FROM customers ORDER BY created_at DESC')
    
    // عرض جميع العمليات
    const operations = await client.query('SELECT * FROM operations ORDER BY created_at DESC')
    
    // عرض الإحصائيات
    const stats = await client.query('SELECT * FROM statistics ORDER BY date DESC')
    
    client.release()
    
    return NextResponse.json({
      customers: customers.rows,
      operations: operations.rows,
      statistics: stats.rows
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

## 📊 **الطريقة 4: استخدام أداة خارجية**

### **1. pgAdmin (مجاني):**
- تحميل من [pgadmin.org](https://www.pgadmin.org/)
- إضافة قاعدة البيانات باستخدام DATABASE_URL

### **2. DBeaver (مجاني):**
- تحميل من [dbeaver.io](https://dbeaver.io/)
- إضافة اتصال PostgreSQL

### **3. TablePlus (مدفوع):**
- واجهة جميلة وسهلة الاستخدام

## 🎯 **التوصية السريعة:**

### **ابدأ بالطريقة 2 (من الموقع):**
1. اذهب إلى `https://mosabri.top/api/database`
2. ستجد جميع المعلومات الأساسية
3. إذا أردت تفاصيل أكثر، استخدم الطريقة 3

## 📋 **ما ستجده في قاعدة البيانات:**

### **جدول العملاء (customers):**
- id: رقم العميل
- name: اسم العميل
- email: البريد الإلكتروني
- phone: رقم الهاتف
- created_at: تاريخ الإنشاء

### **جدول العمليات (operations):**
- id: رقم العملية
- customer_id: رقم العميل
- operation_type: نوع العملية
- result: نتيجة العملية
- created_at: تاريخ العملية

### **جدول الإحصائيات (statistics):**
- id: رقم السجل
- date: التاريخ
- total_operations: إجمالي العمليات
- total_customers: إجمالي العملاء
- created_at: تاريخ الإنشاء

## 🔧 **إنشاء API لعرض الجداول:**

هل تريد مني إنشاء API route لعرض محتوى الجداول بشكل مفصل؟

---

**💡 الطريقة الأسهل هي استخدام `/api/database` من موقعك!** 