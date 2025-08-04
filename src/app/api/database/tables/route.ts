import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

// دالة للتحقق من كلمة المرور
function checkAuth(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123'
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const password = authHeader.replace('Bearer ', '')
  return password === expectedPassword
}

export async function GET(request: Request) {
  // التحقق من الأمان
  if (!checkAuth(request)) {
    return NextResponse.json({
      status: 'error',
      message: 'غير مصرح لك بالوصول. مطلوب كلمة مرور.',
      hint: 'أضف Authorization header مع كلمة المرور'
    }, { 
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer realm="Database Tables Access"'
      }
    })
  }
  try {
    const client = await pool.connect()
    
    // عرض جميع العملاء
    const customers = await client.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        created_at,
        CASE 
          WHEN email IS NOT NULL THEN '✅'
          ELSE '❌'
        END as has_email,
        CASE 
          WHEN phone IS NOT NULL THEN '✅'
          ELSE '❌'
        END as has_phone
      FROM customers 
      ORDER BY created_at DESC 
      LIMIT 50
    `)
    
    // عرض جميع العمليات
    const operations = await client.query(`
      SELECT 
        o.id,
        o.operation_type,
        o.result,
        o.created_at,
        c.name as customer_name,
        c.email as customer_email
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC 
      LIMIT 50
    `)
    
    // عرض الإحصائيات
    const statistics = await client.query(`
      SELECT 
        id,
        date,
        total_operations,
        total_customers,
        created_at
      FROM statistics 
      ORDER BY date DESC 
      LIMIT 30
    `)
    
    // إحصائيات عامة
    const generalStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM operations) as total_operations,
        (SELECT COUNT(*) FROM statistics) as total_statistics,
        (SELECT COUNT(*) FROM customers WHERE email IS NOT NULL) as customers_with_email,
        (SELECT COUNT(*) FROM customers WHERE phone IS NOT NULL) as customers_with_phone
    `)
    
    client.release()
    
    return NextResponse.json({
      status: 'success',
      message: 'تم جلب بيانات الجداول بنجاح',
      timestamp: new Date().toISOString(),
      
      general_stats: generalStats.rows[0],
      
      customers: {
        count: customers.rows.length,
        data: customers.rows
      },
      
      operations: {
        count: operations.rows.length,
        data: operations.rows
      },
      
      statistics: {
        count: statistics.rows.length,
        data: statistics.rows
      },
      
      table_structure: {
        customers: [
          'id (رقم العميل)',
          'name (اسم العميل)',
          'email (البريد الإلكتروني)',
          'phone (رقم الهاتف)',
          'created_at (تاريخ الإنشاء)'
        ],
        operations: [
          'id (رقم العملية)',
          'operation_type (نوع العملية)',
          'result (النتيجة)',
          'customer_name (اسم العميل)',
          'created_at (تاريخ العملية)'
        ],
        statistics: [
          'id (رقم السجل)',
          'date (التاريخ)',
          'total_operations (إجمالي العمليات)',
          'total_customers (إجمالي العملاء)',
          'created_at (تاريخ الإنشاء)'
        ]
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'خطأ في جلب البيانات',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 