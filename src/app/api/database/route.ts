import { NextResponse } from 'next/server'
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
    
    // اختبار الاتصال
    const result = await client.query('SELECT NOW() as current_time, version() as db_version')
    
    // إنشاء الجداول إذا لم تكن موجودة
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS operations (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        operation_type VARCHAR(50),
        result TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS statistics (
        id SERIAL PRIMARY KEY,
        date DATE DEFAULT CURRENT_DATE,
        total_operations INTEGER DEFAULT 0,
        total_customers INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    // الحصول على إحصائيات
    const customersCount = await client.query('SELECT COUNT(*) as count FROM customers')
    const operationsCount = await client.query('SELECT COUNT(*) as count FROM operations')
    
    client.release()
    
    return NextResponse.json({
      status: 'success',
      message: 'قاعدة البيانات متصلة بنجاح!',
      timestamp: result.rows[0].current_time,
      dbVersion: result.rows[0].db_version,
      statistics: {
        customers: customersCount.rows[0].count,
        operations: operationsCount.rows[0].count
      },
      tables: ['customers', 'operations', 'statistics']
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'خطأ في الاتصال بقاعدة البيانات',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, phone } = await request.json()
    
    const client = await pool.connect()
    
    // إضافة عميل جديد
    const result = await client.query(
      'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, email, phone]
    )
    
    client.release()
    
    return NextResponse.json({
      status: 'success',
      message: 'تم إضافة العميل بنجاح',
      customer: result.rows[0]
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'خطأ في إضافة العميل',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 