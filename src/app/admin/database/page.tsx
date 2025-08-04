'use client'

import { useState, useEffect } from 'react'

export default function DatabaseAdmin() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [databaseData, setDatabaseData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/database', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      })
      
      if (response.ok) {
        setIsAuthenticated(true)
        const data = await response.json()
        setDatabaseData(data)
      } else {
        setError('كلمة المرور خاطئة')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const loadTablesData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/database/tables', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDatabaseData(data)
      }
    } catch (err) {
      setError('خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            🔐 إدارة قاعدة البيانات
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل كلمة المرور"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              🗄️ إدارة قاعدة البيانات
            </h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              خروج
            </button>
          </div>
          
          {databaseData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">العملاء</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {databaseData.statistics?.customers || databaseData.general_stats?.total_customers || 0}
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">العمليات</h3>
                <p className="text-2xl font-bold text-green-600">
                  {databaseData.statistics?.operations || databaseData.general_stats?.total_operations || 0}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">الحالة</h3>
                <p className="text-lg font-bold text-purple-600">
                  {databaseData.status === 'success' ? '✅ متصل' : '❌ غير متصل'}
                </p>
              </div>
            </div>
          )}
          
          <button
            onClick={loadTablesData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'جاري التحميل...' : 'تحديث البيانات'}
          </button>
        </div>

        {databaseData && (
          <div className="space-y-6">
            {/* جدول العملاء */}
            {databaseData.customers && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">👥 العملاء ({databaseData.customers.count})</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-right">الاسم</th>
                        <th className="px-4 py-2 text-right">البريد الإلكتروني</th>
                        <th className="px-4 py-2 text-right">الهاتف</th>
                        <th className="px-4 py-2 text-right">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {databaseData.customers.data.map((customer: any) => (
                        <tr key={customer.id} className="border-b">
                          <td className="px-4 py-2">{customer.name}</td>
                          <td className="px-4 py-2">{customer.email || '-'}</td>
                          <td className="px-4 py-2">{customer.phone || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(customer.created_at).toLocaleDateString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* جدول العمليات */}
            {databaseData.operations && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">⚙️ العمليات ({databaseData.operations.count})</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-right">النوع</th>
                        <th className="px-4 py-2 text-right">النتيجة</th>
                        <th className="px-4 py-2 text-right">العميل</th>
                        <th className="px-4 py-2 text-right">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {databaseData.operations.data.map((operation: any) => (
                        <tr key={operation.id} className="border-b">
                          <td className="px-4 py-2">{operation.operation_type}</td>
                          <td className="px-4 py-2 text-sm">{operation.result}</td>
                          <td className="px-4 py-2">{operation.customer_name || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(operation.created_at).toLocaleDateString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 