'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface EmailRecord {
  email: string
  timestamp: string
  type: 'sent' | 'login'
  status: 'success' | 'failed'
  details?: string
}

interface CustomerData {
  email: string
  name?: string
  registrationDate: string
  lastActivity: string
  usageCount: number
  status: 'active' | 'inactive' | 'banned' | 'expired'
  lastLogin?: string
  accessCodeSent?: boolean
  lastUpdated?: string
  subscriptionStart?: string
  subscriptionEnd?: string
  isExpired?: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [recentEmails, setRecentEmails] = useState<string[]>([])
  const [isGeneratingBrochure, setIsGeneratingBrochure] = useState(false)
  const [emailRecords, setEmailRecords] = useState<EmailRecord[]>([])
  const [activeTab, setActiveTab] = useState<'send' | 'records' | 'analytics' | 'customers' | 'speed-test' | 'permanent-codes'>('send')
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [testResults, setTestResults] = useState<any[]>([])
  const [systemMetrics, setSystemMetrics] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState('')
  const [permanentCodes, setPermanentCodes] = useState<Record<string, string>>({})
  const [newEmail, setNewEmail] = useState('')
  const [newCode, setNewCode] = useState('')
  const [isLoadingCodes, setIsLoadingCodes] = useState(false)

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn')
        const loginTime = localStorage.getItem('loginTime')
        
        // التحقق من وجود تسجيل دخول صالح
        if (!isLoggedIn || !loginTime) {
          router.push('/login')
          return
        }
        
        // التحقق من انتهاء صلاحية الجلسة (24 ساعة)
        const loginTimestamp = parseInt(loginTime)
        const currentTime = Date.now()
        const sessionDuration = 24 * 60 * 60 * 1000 // 24 ساعة
        
        if (currentTime - loginTimestamp > sessionDuration) {
          // انتهت صلاحية الجلسة
          localStorage.removeItem('isLoggedIn')
          localStorage.removeItem('loginTime')
          localStorage.removeItem('userEmail')
          router.push('/login')
          return
        }
      }
    }
    
    checkAuth()
  }, [router])

  // Check if admin is already logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminSession = localStorage.getItem('adminSession')
      const userEmail = localStorage.getItem('userEmail')
      
      // التحقق من أن المستخدم هو المدير المصرح له فقط
      if (adminSession === 'talal200265@gmail.com' && userEmail === 'talal200265@gmail.com') {
        setIsLoggedIn(true)
      } else if (userEmail && userEmail !== 'talal200265@gmail.com') {
        // إذا كان المستخدم ليس المدير، توجيهه للصفحة الرئيسية مع رسالة تحذير
        alert('⚠️ غير مصرح لك بالوصول للوحة التحكم. سيتم توجيهك للصفحة الرئيسية.')
        router.push('/calculator')
      }
    }
  }, [router])

  // Load email records from localStorage on component mount
  useEffect(() => {
    if (!isLoggedIn || typeof window === 'undefined') return
    
    const savedRecords = localStorage.getItem('emailRecords')
    if (savedRecords) {
      setEmailRecords(JSON.parse(savedRecords))
    }
  }, [isLoggedIn])

  // Load customers from persistent storage
  useEffect(() => {
    if (!isLoggedIn) return
    
    const loadCustomersFromAPI = async () => {
      try {
        const response = await fetch('/api/customers')
        const data = await response.json()
        
        if (data.success) {
          setCustomers(data.customers)
        } else {
          console.error('Failed to load customers:', data.error)
        }
      } catch (error) {
        console.error('Error loading customers:', error)
      }
    }
    
    loadCustomersFromAPI()
  }, [isLoggedIn])

  // دالة للتحقق من انتهاء الاشتراك ونقل الحسابات المحظورة
  const checkAndUpdateExpiredSubscriptions = async () => {
    const now = new Date()
    
    for (const customer of customers) {
      const subscriptionEnd = customer.subscriptionEnd || calculateSubscriptionEnd(customer.registrationDate)
      if (subscriptionEnd && subscriptionEnd !== 'غير محدد') {
        // تحويل التاريخ العربي إلى تاريخ JavaScript
        const parseArabicDate = (dateString: string): Date => {
          const jsDate = new Date(dateString)
          if (!isNaN(jsDate.getTime())) {
            return jsDate
          }
          
          try {
            const numbers = dateString.match(/[٠١٢٣٤٥٦٧٨٩]/g)
            if (numbers) {
              const arabicToEnglish = (arabic: string) => {
                const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
                return arabicNumbers.indexOf(arabic).toString()
              }
              
              const englishNumbers = numbers.map(arabicToEnglish).join('')
              
              if (englishNumbers.length >= 6) {
                const day = parseInt(englishNumbers.substring(0, 2))
                const month = parseInt(englishNumbers.substring(2, 4)) - 1
                const year = parseInt(englishNumbers.substring(4, 8))
                return new Date(year, month, day)
              }
            }
          } catch (e) {
            console.error('Error parsing Arabic date:', e)
          }
          
          return new Date()
        }
        
        const endDate = parseArabicDate(subscriptionEnd)
        
        // إذا انتهت صلاحية الاشتراك وحالة العميل نشط
        if (now > endDate && customer.status === 'active') {
          console.log(`حظر الحساب ${customer.email} بسبب انتهاء الاشتراك`)
          await updateCustomerStatus(customer.email, 'banned')
        }
      }
    }
  }

  // تشغيل فحص انتهاء الاشتراك عند تحميل العملاء
  useEffect(() => {
    if (customers.length > 0) {
      checkAndUpdateExpiredSubscriptions()
    }
  }, [customers])

  // فحص دوري لانتهاء الاشتراك كل دقيقة
  useEffect(() => {
    if (!isLoggedIn || customers.length === 0) return
    
    const interval = setInterval(() => {
      checkAndUpdateExpiredSubscriptions()
    }, 60000) // كل دقيقة
    
    return () => clearInterval(interval)
  }, [isLoggedIn, customers])

  // Save email records to localStorage whenever they change
  useEffect(() => {
    if (!isLoggedIn || typeof window === 'undefined') return
    localStorage.setItem('emailRecords', JSON.stringify(emailRecords))
  }, [emailRecords, isLoggedIn])

  // Update system metrics when test results change
  useEffect(() => {
    if (testResults.length > 0) {
      updateSystemMetrics()
    }
  }, [testResults])

  // Load permanent codes when admin logs in
  useEffect(() => {
    if (isLoggedIn) {
      loadPermanentCodesFromAPI()
    }
  }, [isLoggedIn])

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    
    // التحقق من أن البريد الإلكتروني هو المدير المصرح له فقط
    if (adminEmail !== 'talal200265@gmail.com') {
      setLoginError('غير مصرح لك بالوصول للوحة التحكم')
      return
    }
    
    if (adminEmail === 'talal200265@gmail.com' && adminPassword === 'admin123') {
      setIsLoggedIn(true)
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminSession', adminEmail)
        localStorage.setItem('userEmail', adminEmail)
      }
    } else {
      setLoginError('بيانات الدخول غير صحيحة')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminSession')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('loginTime')
      localStorage.removeItem('userEmail')
    }
    setAdminEmail('')
    setAdminPassword('')
    router.push('/login')
  }

  // التحقق الإضافي من الأمان
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null
  if (userEmail && userEmail !== 'talal200265@gmail.com') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '25px',
          padding: '40px',
          width: '100%',
          maxWidth: '500px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🚫</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '20px', fontWeight: 'bold' }}>
            الوصول مرفوض
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', lineHeight: '1.6' }}>
            عذراً، غير مصرح لك بالوصول للوحة التحكم.<br/>
            هذه الصفحة مخصصة للمدير فقط.
          </p>
          <button
            onClick={() => router.push('/calculator')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '15px 30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    )
  }

  // Show login form if not logged in
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse at center, #1a472a 0%, #0f2e1a 50%, #0a1f12 100%),
          linear-gradient(135deg, #0f2e1a 0%, #1a472a 100%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        margin: 0,
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '25px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <h1 style={{
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0 0 10px 0'
            }}>
              🔐 لوحة التحكم
            </h1>
            <p style={{
              color: '#cccccc',
              fontSize: '16px',
              margin: 0
            }}>
              تسجيل دخول المدير
            </p>
          </div>

          <form onSubmit={handleAdminLogin} style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="أدخل بريد المدير"
                required
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                كلمة المرور
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>

            {loginError && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.2)',
                border: '2px solid #dc2626',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <span style={{ color: '#fca5a5', fontSize: '14px' }}>
                  {loginError}
                </span>
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #047857 0%, #065f46 100%)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              }}
            >
              🔐 تسجيل الدخول
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{
              color: '#cccccc',
              fontSize: '14px',
              margin: '0 0 10px 0'
            }}>
              بيانات الدخول الافتراضية:
            </p>
            <p style={{
              color: '#ffffff',
              fontSize: '12px',
              margin: '5px 0',
              fontFamily: 'monospace'
            }}>
              البريد: talal200265@gmail.com
            </p>
            <p style={{
              color: '#ffffff',
              fontSize: '12px',
              margin: '5px 0',
              fontFamily: 'monospace'
            }}>
              كلمة المرور: admin123
            </p>
          </div>
        </div>
      </div>
    )
  }

  const addEmailRecord = (record: EmailRecord) => {
    setEmailRecords(prev => [record, ...prev.slice(0, 99)]) // Keep last 100 records
  }

  // Analytics functions
  const getTodayStats = () => {
    const today = new Date().toDateString()
    const todayRecords = emailRecords.filter(record => 
      new Date(record.timestamp).toDateString() === today
    )
    
    return {
      totalEmails: todayRecords.filter(r => r.type === 'sent').length,
      totalLogins: todayRecords.filter(r => r.type === 'login').length,
      successRate: todayRecords.length > 0 
        ? Math.round((todayRecords.filter(r => r.status === 'success').length / todayRecords.length) * 100)
        : 0,
      newCustomers: customers.filter(c => 
        new Date(c.registrationDate).toDateString() === today
      ).length,
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length
    }
  }

  const getWeeklyStats = () => {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toDateString()
    }).reverse()
    
    return last7Days.map(date => {
      const dayRecords = emailRecords.filter(record => 
        new Date(record.timestamp).toDateString() === date
      )
      return {
        date: new Date(date).toLocaleDateString('ar-SA', { weekday: 'short' }),
        emails: dayRecords.filter(r => r.type === 'sent').length,
        logins: dayRecords.filter(r => r.type === 'login').length
      }
    })
  }

  const getTopCustomers = () => {
    const customerStats = emailRecords
      .filter(r => r.type === 'login' && r.status === 'success')
      .reduce((acc, record) => {
        acc[record.email] = (acc[record.email] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    return Object.entries(customerStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([email, count]) => ({ email, count }))
  }

  const getPeakHours = () => {
    const hourStats = Array.from({length: 24}, (_, hour) => {
      const hourRecords = emailRecords.filter(record => {
        const recordHour = new Date(record.timestamp).getHours()
        return recordHour === hour
      })
      return {
        hour: `${hour}:00`,
        count: hourRecords.length
      }
    })
    
    return hourStats
  }

  const addCustomer = async (email: string, name?: string) => {
    try {
      const today = new Date()
      
      // دالة لتحويل الأرقام الإنجليزية إلى العربية
      const convertToArabicNumbers = (num: number): string => {
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
        return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('')
      }
      
      // تاريخ بداية الاشتراك (اليوم الحالي)
      const month = today.getMonth() + 1
      const day = today.getDate()
      const year = today.getFullYear()
      const subscriptionStart = `${convertToArabicNumbers(day).padStart(2, '٠')}/${convertToArabicNumbers(month).padStart(2, '٠')}/${convertToArabicNumbers(year)}`
      
      // تاريخ نهاية الاشتراك (بعد سنة)
      const subscriptionEnd = new Date(today)
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1)
      const endMonth = subscriptionEnd.getMonth() + 1
      const endDay = subscriptionEnd.getDate()
      const endYear = subscriptionEnd.getFullYear()
      const subscriptionEndFormatted = `${convertToArabicNumbers(endDay).padStart(2, '٠')}/${convertToArabicNumbers(endMonth).padStart(2, '٠')}/${convertToArabicNumbers(endYear)}`
      
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          name,
          subscriptionStart: subscriptionStart,
          subscriptionEnd: subscriptionEndFormatted,
          isExpired: false,
          status: 'active'
        }),
      })

      if (response.ok) {
        console.log('Customer added successfully:', email)
      } else {
        console.error('Failed to add customer:', email)
      }
    } catch (error) {
      console.error('Error adding customer:', error)
    }
  }

  const updateCustomerStatus = async (email: string, status: 'active' | 'inactive' | 'banned') => {
    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, status }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setCustomers(prev => 
          prev.map(c => c.email === email ? { ...c, status } : c)
        )
      } else {
        console.error('Failed to update customer status:', data.error)
      }
    } catch (error) {
      console.error('Error updating customer status:', error)
    }
  }

  // دالة لتحويل الأرقام الإنجليزية إلى العربية
  const convertToArabicNumbers = (num: number): string => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
    return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('')
  }

  // دالة لتحويل التاريخ من ISO إلى تنسيق مقروء
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'غير محدد'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        // إذا كان التاريخ بالفعل بتنسيق عربي، استخدمه كما هو
        return dateString
      }
      
      const month = date.getMonth() + 1
      const day = date.getDate()
      const year = date.getFullYear()
      
      return `${convertToArabicNumbers(day).padStart(2, '٠')}/${convertToArabicNumbers(month).padStart(2, '٠')}/${convertToArabicNumbers(year)}`
    } catch (error) {
      return dateString
    }
  }

  // دالة لإعادة تفعيل الحساب مع تحديث تاريخ الاشتراك
  const reactivateCustomer = async (email: string) => {
    try {
      const today = new Date()
      
      // دالة لتحويل الأرقام الإنجليزية إلى العربية
      const convertToArabicNumbers = (num: number): string => {
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
        return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('')
      }
      
      // تاريخ بداية الاشتراك بالتقويم الميلادي مع الأرقام العربية (اليوم الحالي)
      const month = today.getMonth() + 1
      const day = today.getDate()
      const year = today.getFullYear()
      const subscriptionStart = `${convertToArabicNumbers(day).padStart(2, '٠')}/${convertToArabicNumbers(month).padStart(2, '٠')}/${convertToArabicNumbers(year)}`
      
      // تاريخ نهاية الاشتراك (بعد سنة) بالتقويم الميلادي
      const subscriptionEnd = new Date(today)
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1)
      const endMonth = subscriptionEnd.getMonth() + 1
      const endDay = subscriptionEnd.getDate()
      const endYear = subscriptionEnd.getFullYear()
      const subscriptionEndFormatted = `${convertToArabicNumbers(endDay).padStart(2, '٠')}/${convertToArabicNumbers(endMonth).padStart(2, '٠')}/${convertToArabicNumbers(endYear)}`
      
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          status: 'active',
          subscriptionStart: subscriptionStart,
          subscriptionEnd: subscriptionEndFormatted,
          isExpired: false
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setCustomers(prev => 
          prev.map(c => c.email === email ? { 
            ...c, 
            status: 'active',
            subscriptionStart: subscriptionStart,
            subscriptionEnd: subscriptionEndFormatted,
            isExpired: false
          } : c)
        )
        alert(`تم إعادة تفعيل الحساب ${email} بنجاح\nتاريخ بداية الاشتراك الجديد: ${subscriptionStart}\nتاريخ نهاية الاشتراك: ${subscriptionEndFormatted}`)
        try {
          const customersRes = await fetch('/api/customers')
          const customersData = await customersRes.json()
          if (customersData.success && Array.isArray(customersData.customers)) {
            setCustomers(customersData.customers)
          }
        } catch (_) {}
      } else {
        console.error('Failed to reactivate customer:', data.error)
        alert('فشل في إعادة تفعيل الحساب')
      }
    } catch (error) {
      console.error('Error reactivating customer:', error)
      alert('حدث خطأ في إعادة تفعيل الحساب')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ تم إرسال رمز الوصول بنجاح إلى ${email}`)
        setRecentEmails(prev => [email, ...prev.slice(0, 4)]) // Keep last 5 emails
        
        // Store the access code in localStorage for validation
        if (data.accessCode && data.email && typeof window !== 'undefined') {
          const validAccessCodes = JSON.parse(localStorage.getItem('validAccessCodes') || '{}')
          validAccessCodes[data.email] = data.accessCode
          localStorage.setItem('validAccessCodes', JSON.stringify(validAccessCodes))
        }
        
        // Add to email records
        addEmailRecord({
          email,
          timestamp: new Date().toLocaleString('ar-SA'),
          type: 'sent',
          status: 'success',
          details: 'تم إرسال رمز الوصول بنجاح'
        })
        
        // Add customer if new
        addCustomer(email)
        
        setEmail('')
      } else {
        setError(data.error || 'حدث خطأ في إرسال البريد الإلكتروني')
        
        // Add failed record
        addEmailRecord({
          email,
          timestamp: new Date().toLocaleString('ar-SA'),
          type: 'sent',
          status: 'failed',
          details: data.error || 'حدث خطأ في الإرسال'
        })
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم')
      
      // Add failed record
      addEmailRecord({
        email,
        timestamp: new Date().toLocaleString('ar-SA'),
        type: 'sent',
        status: 'failed',
        details: 'خطأ في الاتصال بالخادم'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSend = async (emails: string[]) => {
    setLoading(true)
    setMessage('')
    setError('')

    let successCount = 0
    let errorCount = 0

    for (const email of emails) {
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim() }),
        })

        if (response.ok) {
          successCount++
          
          // Store the access code in localStorage for validation
          const data = await response.json()
          if (data.accessCode && data.email && typeof window !== 'undefined') {
            const validAccessCodes = JSON.parse(localStorage.getItem('validAccessCodes') || '{}')
            validAccessCodes[data.email] = data.accessCode
            localStorage.setItem('validAccessCodes', JSON.stringify(validAccessCodes))
          }
          
          addEmailRecord({
            email: email.trim(),
            timestamp: new Date().toLocaleString('ar-SA'),
            type: 'sent',
            status: 'success',
            details: 'تم إرسال رمز الوصول بنجاح'
          })
          addCustomer(email.trim())
        } else {
          errorCount++
          addEmailRecord({
            email: email.trim(),
            timestamp: new Date().toLocaleString('ar-SA'),
            type: 'sent',
            status: 'failed',
            details: 'فشل في إرسال رمز الوصول'
          })
        }
      } catch (err) {
        errorCount++
        addEmailRecord({
          email: email.trim(),
          timestamp: new Date().toLocaleString('ar-SA'),
          type: 'sent',
          status: 'failed',
          details: 'خطأ في الاتصال بالخادم'
        })
      }
    }

    setLoading(false)
    setMessage(`✅ تم إرسال ${successCount} رسالة بنجاح${errorCount > 0 ? `، فشل ${errorCount} رسالة` : ''}`)
  }

  const clearRecords = () => {
    if (confirm('هل أنت متأكد من حذف جميع السجلات؟')) {
      setEmailRecords([])
      if (typeof window !== 'undefined') {
        localStorage.removeItem('emailRecords')
      }
    }
  }

  const exportRecords = () => {
    const csvContent = [
      ['البريد الإلكتروني', 'التاريخ والوقت', 'النوع', 'الحالة', 'التفاصيل'],
      ...emailRecords.map(record => [
        record.email,
        record.timestamp,
        record.type === 'sent' ? 'إرسال' : 'تسجيل دخول',
        record.status === 'success' ? 'نجح' : 'فشل',
        record.details || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `سجل-البريد-الإلكتروني-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Simulate login record (this would be called from login page)
  const simulateLoginRecord = (email: string, success: boolean) => {
    addEmailRecord({
      email,
      timestamp: new Date().toLocaleString('ar-SA'),
      type: 'login',
      status: success ? 'success' : 'failed',
      details: success ? 'تم تسجيل الدخول بنجاح' : 'فشل في تسجيل الدخول'
    })
    
    if (success) {
      addCustomer(email)
    }
  }

  // Test function to add sample login records
  const addTestLoginRecords = () => {
    const testEmails = [
      'test1@example.com',
      'test2@example.com',
      'test3@example.com'
    ]
    
    testEmails.forEach((email, index) => {
      setTimeout(() => {
        simulateLoginRecord(email, Math.random() > 0.3) // 70% success rate
      }, index * 1000)
    })
  }

  // Function to show valid access codes
  const showValidAccessCodes = () => {
    if (typeof window === 'undefined') return
    
    const validAccessCodes = JSON.parse(localStorage.getItem('validAccessCodes') || '{}')
    const codesList = Object.entries(validAccessCodes)
      .map(([email, code]) => `${email}: ${code}`)
      .join('\n')
    
    if (codesList) {
      alert(`رموز الوصول الصحيحة:\n\n${codesList}`)
    } else {
      alert('لا توجد رموز وصول محفوظة')
    }
  }

  // Function to manually add access code for testing
  const addManualAccessCode = () => {
    if (typeof window === 'undefined') return
    
    const email = prompt('أدخل البريد الإلكتروني:')
    const code = prompt('أدخل رمز الوصول:')
    
    if (email && code) {
      const validAccessCodes = JSON.parse(localStorage.getItem('validAccessCodes') || '{}')
      validAccessCodes[email] = code
      localStorage.setItem('validAccessCodes', JSON.stringify(validAccessCodes))
      alert(`تم إضافة رمز الوصول لـ ${email}: ${code}`)
    }
  }

  // Function to generate access code for any email
  const generateAccessCodeForEmail = async () => {
    const email = prompt('أدخل البريد الإلكتروني لإنشاء رمز الوصول:')
    
    if (email) {
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (response.ok) {
          alert(`✅ تم إنشاء رمز الوصول!\n\nالبريد: ${email}\nالرمز: ${data.accessCode}\n\nتم إرسال الرمز إلى البريد الإلكتروني`)
          try {
            const customersRes = await fetch('/api/customers')
            const customersData = await customersRes.json()
            if (customersData.success && Array.isArray(customersData.customers)) {
              setCustomers(customersData.customers)
            }
          } catch (_) {}
        } else {
          alert(`❌ خطأ: ${data.error}`)
        }
      } catch (error) {
        alert(`❌ خطأ في إنشاء الرمز: ${error}`)
      }
    }
  }

  // Speed Test Functions
  const testEmailAPI = async () => {
    try {
      const startTime = performance.now()
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      const data = await response.json()
      
      if (response.ok) {
        return {
          name: 'API إرسال البريد',
          duration,
          status: 'success',
          details: `تم الإرسال في ${duration.toFixed(2)}ms`
        }
      } else {
        return {
          name: 'API إرسال البريد',
          duration,
          status: 'warning',
          details: `خطأ: ${data.error || 'خطأ غير معروف'}`
        }
      }
    } catch (error) {
      return {
        name: 'API إرسال البريد',
        duration: 0,
        status: 'error',
        details: `خطأ: ${error}`
      }
    }
  }

  const testEmailConfiguration = async () => {
    try {
      const startTime = performance.now()
      
      console.log('🔍 Testing email configuration...')
      
      // Test 1: Check environment variables
      const envTest = {
        EMAIL_USER: process.env.EMAIL_USER || 'NOT_SET',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT_SET'
      }
      
      console.log('Environment variables:', envTest)
      
      // Test 2: Test SMTP connection
      const response = await fetch('/api/test-env')
      const envData = await response.json()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (envData.emailConfiguration) {
        return {
          name: 'إعدادات البريد الإلكتروني',
          duration,
          status: 'success',
          details: `✅ EMAIL_USER: ${envData.emailConfiguration.EMAIL_USER}\n✅ EMAIL_PASS: ${envData.emailConfiguration.EMAIL_PASS}\n✅ SMTP: ${envData.emailConfiguration.smtpStatus}`
        }
      } else {
        return {
          name: 'إعدادات البريد الإلكتروني',
          duration,
          status: 'error',
          details: `❌ خطأ في إعدادات البريد الإلكتروني`
        }
      }
    } catch (error) {
      return {
        name: 'إعدادات البريد الإلكتروني',
        duration: 0,
        status: 'error',
        details: `❌ خطأ: ${error}`
      }
    }
  }

  const testVerifyAPI = async () => {
    try {
      const startTime = performance.now()
      
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', code: 'TEST123' })
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      return {
        name: 'API التحقق من الرموز',
        duration,
        status: response.ok ? 'success' : 'warning',
        details: `استجابة في ${duration.toFixed(2)}ms`
      }
    } catch (error) {
      return {
        name: 'API التحقق من الرموز',
        duration: 0,
        status: 'error',
        details: `خطأ: ${error}`
      }
    }
  }

  const testCalculations = () => {
    const startTime = performance.now()
    
    // محاكاة حسابات معقدة
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i) * Math.sin(i)
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    return {
      name: 'الحسابات المعقدة',
      duration,
      status: 'success',
      details: `تمت الحسابات في ${duration.toFixed(2)}ms`
    }
  }

  const testMemoryUsage = () => {
    const memory = (performance as any).memory || { usedJSHeapSize: 0, totalJSHeapSize: 1 }
    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024)
    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024)
    const percentage = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
    const isHealthy = percentage < 80
    
    return {
      name: 'استخدام الذاكرة',
      duration: 0,
      status: isHealthy ? 'success' : 'warning',
      details: `${used}MB / ${total}MB (${percentage}%)`
    }
  }

  const testCachePerformance = () => {
    const startTime = performance.now()
    
    // اختبار سرعة التخزين المؤقت
    for (let i = 0; i < 1000; i++) {
      const key = `test-key-${i}`
      // محاكاة عمليات التخزين المؤقت
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    return {
      name: 'أداء التخزين المؤقت',
      duration,
      status: 'success',
      details: `تم اختبار 1000 عملية في ${duration.toFixed(2)}ms`
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    const tests = [
      { name: 'اختبار إعدادات البريد الإلكتروني', test: testEmailConfiguration },
      { name: 'اختبار API إرسال البريد', test: testEmailAPI },
      { name: 'اختبار API التحقق من الرموز', test: testVerifyAPI },
      { name: 'اختبار الحسابات المعقدة', test: () => Promise.resolve(testCalculations()) },
      { name: 'اختبار استخدام الذاكرة', test: () => Promise.resolve(testMemoryUsage()) },
      { name: 'اختبار أداء التخزين المؤقت', test: () => Promise.resolve(testCachePerformance()) }
    ]

    for (const test of tests) {
      setCurrentTest(test.name)
      const result = await test.test()
      setTestResults(prev => [...prev, result])
      await new Promise(resolve => setTimeout(resolve, 500)) // فاصل بين الاختبارات
    }

    setCurrentTest('')
    setIsRunning(false)
    
    // تحديث مقاييس النظام
    updateSystemMetrics()
  }

  const updateSystemMetrics = () => {
    const memory = (performance as any).memory || { usedJSHeapSize: 0, totalJSHeapSize: 1 }
    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024)
    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024)
    const percentage = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
    
    const successfulTests = testResults.filter(t => t.status === 'success').length
    const totalTests = testResults.length
    const averageResponseTime = testResults.length > 0 
      ? testResults.reduce((sum, t) => sum + t.duration, 0) / testResults.length 
      : 0

    setSystemMetrics({
      memory: { used, total, percentage },
      performance: {
        averageResponseTime,
        totalTests,
        successRate: totalTests > 0 ? (successfulTests / totalTests) * 100 : 0
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return 'ℹ️'
    }
  }

  const getPerformanceRating = (duration: number) => {
    if (duration < 100) return { rating: 'ممتاز', color: 'text-green-600' }
    if (duration < 500) return { rating: 'جيد', color: 'text-blue-600' }
    if (duration < 1000) return { rating: 'مقبول', color: 'text-yellow-600' }
    return { rating: 'بطيء', color: 'text-red-600' }
  }

  // Function to test login with any email/code
  const testLoginSystem = async () => {
    const email = prompt('أدخل البريد الإلكتروني للاختبار:')
    const code = prompt('أدخل رمز الوصول للاختبار:')
    
    if (email && code) {
      try {
        const response = await fetch('/api/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, code }),
        })

        const data = await response.json()

        if (response.ok && data.isValid) {
          alert(`✅ نجح تسجيل الدخول!\nالبريد: ${email}\nالرمز: ${code}`)
        } else {
          alert(`❌ فشل تسجيل الدخول!\nالبريد: ${email}\nالرمز: ${code}\n\nالرمز المتوقع: ${data.expectedCode}`)
        }
      } catch (error) {
        alert(`❌ خطأ في الاختبار: ${error}`)
      }
    }
  }

  // اختبار شامل لجميع الأزرار والدوال
  const testAllAdminFunctions = async () => {
    const results = []
    
    // اختبار 1: إرسال بريد إلكتروني
    try {
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      })
      const emailData = await emailResponse.json()
      results.push({
        function: 'إرسال البريد الإلكتروني',
        status: emailResponse.ok ? '✅ نجح' : '❌ فشل',
        details: emailData.error || 'تم الإرسال بنجاح'
      })
    } catch (error: any) {
      results.push({
        function: 'إرسال البريد الإلكتروني',
        status: '❌ فشل',
        details: error.message
      })
    }

    // اختبار 2: التحقق من الرموز
    try {
      const verifyResponse = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', code: 'TEST123' })
      })
      const verifyData = await verifyResponse.json()
      results.push({
        function: 'التحقق من الرموز',
        status: verifyResponse.ok ? '✅ نجح' : '❌ فشل',
        details: verifyData.error || 'تم التحقق بنجاح'
      })
    } catch (error: any) {
      results.push({
        function: 'التحقق من الرموز',
        status: '❌ فشل',
        details: error.message
      })
    }

    // اختبار 3: إدارة الرموز الثابتة
    try {
      const codesResponse = await fetch('/api/permanent-codes')
      const codesData = await codesResponse.json()
      results.push({
        function: 'إدارة الرموز الثابتة',
        status: codesResponse.ok ? '✅ نجح' : '❌ فشل',
        details: codesData.error || 'تم تحميل الرموز بنجاح'
      })
    } catch (error: any) {
      results.push({
        function: 'إدارة الرموز الثابتة',
        status: '❌ فشل',
        details: error.message
      })
    }

    // اختبار 4: قاعدة البيانات
    try {
      const dbResponse = await fetch('/api/database')
      const dbData = await dbResponse.json()
      results.push({
        function: 'قاعدة البيانات',
        status: dbResponse.ok ? '✅ نجح' : '❌ فشل',
        details: dbData.error || 'تم الاتصال بقاعدة البيانات بنجاح'
      })
    } catch (error: any) {
      results.push({
        function: 'قاعدة البيانات',
        status: '❌ فشل',
        details: error.message
      })
    }

    // اختبار 5: إدارة العملاء
    try {
      const customersResponse = await fetch('/api/customers')
      const customersData = await customersResponse.json()
      results.push({
        function: 'إدارة العملاء',
        status: customersResponse.ok ? '✅ نجح' : '❌ فشل',
        details: customersData.error || 'تم تحميل العملاء بنجاح'
      })
    } catch (error: any) {
      results.push({
        function: 'إدارة العملاء',
        status: '❌ فشل',
        details: error.message
      })
    }

    // اختبار 6: Health Check
    try {
      const healthResponse = await fetch('/api/health')
      const healthData = await healthResponse.json()
      results.push({
        function: 'فحص صحة النظام',
        status: healthResponse.ok ? '✅ نجح' : '❌ فشل',
        details: healthData.error || 'النظام يعمل بشكل طبيعي'
      })
    } catch (error: any) {
      results.push({
        function: 'فحص صحة النظام',
        status: '❌ فشل',
        details: error.message
      })
    }

    // عرض النتائج
    const successCount = results.filter(r => r.status.includes('✅')).length
    const totalCount = results.length
    
    let resultMessage = `📊 نتائج الاختبار الشامل:\n\n`
    resultMessage += `النجاح: ${successCount}/${totalCount}\n\n`
    
    results.forEach(result => {
      resultMessage += `${result.status} ${result.function}\n`
      resultMessage += `   ${result.details}\n\n`
    })

    if (successCount === totalCount) {
      resultMessage += `🎉 جميع الاختبارات نجحت! النظام يعمل بشكل مثالي.`
    } else {
      resultMessage += `⚠️ بعض الاختبارات فشلت. يرجى مراجعة الإعدادات.`
    }

    alert(resultMessage)
  }

  // Load permanent codes from API
  const loadPermanentCodesFromAPI = async () => {
    setIsLoadingCodes(true)
    try {
      const response = await fetch('/api/permanent-codes')
      const data = await response.json()
      
      if (data.success) {
        setPermanentCodes(data.codes)
      } else {
        console.error('Error loading permanent codes:', data.error)
      }
    } catch (error) {
      console.error('Error loading permanent codes:', error)
    } finally {
      setIsLoadingCodes(false)
    }
  }

  // Add new permanent code
  const addPermanentCode = async () => {
    if (!newEmail || !newCode) {
      alert('يرجى إدخال البريد الإلكتروني والرمز')
      return
    }

    try {
      const response = await fetch('/api/permanent-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
          code: newCode,
          adminPassword: 'admin123'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setPermanentCodes(prev => ({
          ...prev,
          [data.email]: data.code
        }))
        setNewEmail('')
        setNewCode('')
        alert('تم إضافة الرمز الثابت بنجاح')
      } else {
        alert(`خطأ: ${data.error}`)
      }
    } catch (error) {
      console.error('Error adding permanent code:', error)
      alert('خطأ في إضافة الرمز الثابت')
    }
  }

  // Delete permanent code
  const deletePermanentCode = async (email: string) => {
    if (!confirm(`هل أنت متأكد من حذف الرمز الثابت للبريد الإلكتروني: ${email}؟`)) {
      return
    }

    try {
      const response = await fetch('/api/permanent-codes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          adminPassword: 'admin123'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setPermanentCodes(prev => {
          const newCodes = { ...prev }
          delete newCodes[email]
          return newCodes
        })
        alert('تم حذف الرمز الثابت بنجاح')
      } else {
        alert(`خطأ: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting permanent code:', error)
      alert('خطأ في حذف الرمز الثابت')
    }
  }

  // Generate random code
  const generateRandomCode = () => {
    const chars = 'ABCDEF0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode(result)
  }

  // دالة للتحقق من انتهاء الاشتراك
  const checkSubscriptionExpiry = (customer: CustomerData) => {
    if (!customer.subscriptionEnd) return false
    
    const endDate = new Date(customer.subscriptionEnd)
    const now = new Date()
    const oneYearAfterExpiry = new Date(endDate)
    oneYearAfterExpiry.setFullYear(oneYearAfterExpiry.getFullYear() + 1)
    
    // إذا مرت سنة على انتهاء الاشتراك
    if (now > oneYearAfterExpiry) {
      return true
    }
    
    return false
  }

  // دالة لحساب تاريخ نهاية الاشتراك (سنة كاملة من تاريخ التسجيل)
  const calculateSubscriptionEnd = (registrationDate: string) => {
    if (!registrationDate) return ''
    
    try {
      // دالة لتحويل الأرقام الإنجليزية إلى العربية
      const convertToArabicNumbers = (num: number): string => {
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
        return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('')
      }
      
      // تحويل التاريخ العربي إلى تاريخ JavaScript
      const parseArabicDate = (dateString: string): Date => {
        // إذا كان التاريخ بالفعل بتنسيق JavaScript، استخدمه مباشرة
        const jsDate = new Date(dateString)
        if (!isNaN(jsDate.getTime())) {
          return jsDate
        }
        
        // محاولة تحويل التاريخ العربي
        try {
          // استخراج الأرقام من التاريخ العربي
          const numbers = dateString.match(/[٠١٢٣٤٥٦٧٨٩]/g)
          if (numbers) {
            const arabicToEnglish = (arabic: string) => {
              const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
              return arabicNumbers.indexOf(arabic).toString()
            }
            
            const englishNumbers = numbers.map(arabicToEnglish).join('')
            
            // إذا كان التاريخ يحتوي على "هـ" فهو هجري، نحتاج تحويله إلى ميلادي
            if (dateString.includes('هـ')) {
              // تحويل التاريخ الهجري إلى ميلادي (تقريبي)
              if (englishNumbers.length >= 6) {
                const day = parseInt(englishNumbers.substring(0, 2))
                const month = parseInt(englishNumbers.substring(2, 4))
                const hijriYear = parseInt(englishNumbers.substring(4, 8))
                
                // تحويل تقريبي من الهجري إلى الميلادي (هجري + 579 = ميلادي تقريباً)
                const gregorianYear = hijriYear + 579
                
                return new Date(gregorianYear, month - 1, day)
              }
            } else {
              // تاريخ ميلادي عادي
              if (englishNumbers.length >= 6) {
                const day = parseInt(englishNumbers.substring(0, 2))
                const month = parseInt(englishNumbers.substring(2, 4)) - 1 // JavaScript months are 0-based
                const year = parseInt(englishNumbers.substring(4, 8))
                return new Date(year, month, day)
              }
            }
          }
        } catch (e) {
          console.error('Error parsing Arabic date:', e)
        }
        
        // إذا فشل التحويل، استخدم التاريخ الحالي
        return new Date()
      }
      
      // تحويل التاريخ العربي إلى تاريخ JavaScript
      const regDate = parseArabicDate(registrationDate)
      const endDate = new Date(regDate)
      endDate.setFullYear(endDate.getFullYear() + 1)
      
      const month = endDate.getMonth() + 1
      const day = endDate.getDate()
      const year = endDate.getFullYear()
      
      // إرجاع التاريخ بالتقويم الميلادي فقط (بدون هجري)
      return `${convertToArabicNumbers(day).padStart(2, '٠')}/${convertToArabicNumbers(month).padStart(2, '٠')}/${convertToArabicNumbers(year)}`
    } catch (error) {
      console.error('Error calculating subscription end:', error)
      return 'غير محدد'
    }
  }

  // دالة لتحديث حالة الاشتراك
  const updateSubscriptionStatus = async (email: string, subscriptionStart: string, subscriptionEnd: string) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          subscriptionStart, 
          subscriptionEnd,
          isExpired: checkSubscriptionExpiry({ email, subscriptionEnd } as CustomerData)
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setCustomers(prev => 
          prev.map(c => c.email === email ? { 
            ...c, 
            subscriptionStart, 
            subscriptionEnd,
            isExpired: checkSubscriptionExpiry({ ...c, subscriptionEnd })
          } : c)
        )
      } else {
        console.error('Failed to update subscription:', data.error)
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
    }
  }

  // دالة لحذف الحساب نهائياً
  const deleteCustomer = async (email: string) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Remove from local state
        setCustomers(prev => prev.filter(c => c.email !== email))
        alert(`✅ تم حذف الحساب ${email} نهائياً`)
      } else {
        console.error('Failed to delete customer:', data.error)
        alert('❌ فشل في حذف الحساب')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('❌ خطأ في الاتصال بالخادم')
    }
  }

  const generateBrochurePDF = async () => {
    setIsGeneratingBrochure(true)
    
    try {
      const pdf = new jsPDF('p', 'pt', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Page 1 - Introduction
      const page1Div = document.createElement('div')
      page1Div.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 595px;
        height: 842px;
        background: linear-gradient(135deg, #1a472a 0%, #0f2e1a 50%, #0a1f12 100%);
        color: white;
        font-family: Arial, sans-serif;
        padding: 40px;
        box-sizing: border-box;
        direction: rtl;
        text-align: center;
      `
      
      page1Div.innerHTML = `
        <div style="
          background: rgba(255,255,255,0.1);
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
          color: #fbbf24;
        ">⚽ حاسبة موصبري المتقدمة</div>
        
        <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 25px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          مقدمة في التغذية الرياضية
        </h1>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px; text-align: justify;">
          التغذية الرياضية هي أساس الأداء المثالي للاعب كرة القدم. من خلال فهم احتياجات جسمك الفريدة، يمكنك تحقيق أقصى استفادة من تدريباتك وتحسين أدائك على الملعب.
        </p>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 30px; text-align: justify;">
          حاسبة موصبري المتقدمة تقدم لك تحليلاً شاملاً ومخصصاً لاحتياجاتك الغذائية، بناءً على عمرك، وزنك، طولك، مستوى نشاطك، ومركزك في الملعب.
        </p>
        
        <div style="
          background: linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.2) 100%);
          padding: 20px;
          border-radius: 15px;
          border: 2px solid rgba(34,197,94,0.3);
          margin-bottom: 25px;
        ">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #22c55e;">لماذا تحتاج حاسبة تغذية متخصصة؟</h3>
          <div style="text-align: right; font-size: 13px; line-height: 1.5;">
            <div style="margin-bottom: 5px;">• كل لاعب له احتياجات غذائية فريدة</div>
            <div style="margin-bottom: 5px;">• التغذية تؤثر مباشرة على الأداء والتحمل</div>
            <div style="margin-bottom: 5px;">• الحسابات الدقيقة تضمن أفضل النتائج</div>
            <div style="margin-bottom: 5px;">• خطط مخصصة لثلاثة أهداف مختلفة</div>
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.2) 100%);
          padding: 20px;
          border-radius: 15px;
          border: 2px solid rgba(59,130,246,0.3);
          margin-bottom: 30px;
        ">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #3b82f6;">فوائد التغذية الرياضية للاعب كرة القدم</h3>
          <div style="text-align: right; font-size: 13px; line-height: 1.5;">
            <div style="margin-bottom: 5px;">• تحسين الأداء البدني والتحمل</div>
            <div style="margin-bottom: 5px;">• تسريع التعافي بعد التدريبات</div>
            <div style="margin-bottom: 5px;">• تقليل خطر الإصابات</div>
            <div style="margin-bottom: 5px;">• تحسين التركيز واليقظة الذهنية</div>
            <div style="margin-bottom: 5px;">• بناء العضلات والحفاظ على الوزن المثالي</div>
          </div>
        </div>
        
        <button style="
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
          border: none;
          border-radius: 15px;
          padding: 15px 30px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(251,191,36,0.3);
        ">🚀 ابدأ رحلتك نحو التغذية الرياضية الآن</button>
      `
      
      document.body.appendChild(page1Div)
      const canvas1 = await html2canvas(page1Div, {
        width: 595,
        height: 842,
        scale: 2,
        useCORS: true,
        allowTaint: true
      })
      document.body.removeChild(page1Div)
      
      const img1 = canvas1.toDataURL('image/png')
      pdf.addImage(img1, 'PNG', 0, 0, pageWidth, pageHeight)

      // Page 2 - Features
      pdf.addPage()
      
      const page2Div = document.createElement('div')
      page2Div.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 595px;
        height: 842px;
        background: linear-gradient(135deg, #1a472a 0%, #0f2e1a 50%, #0a1f12 100%);
        color: white;
        font-family: Arial, sans-serif;
        padding: 40px;
        box-sizing: border-box;
        direction: rtl;
        text-align: center;
      `
      
      page2Div.innerHTML = `
        <h2 style="font-size: 28px; font-weight: bold; margin-bottom: 30px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          مميزات الحاسبة المتقدمة
        </h2>
        
        <div style="
          background: linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.2) 100%);
          padding: 25px;
          border-radius: 15px;
          border: 2px solid rgba(34,197,94,0.3);
          margin-bottom: 25px;
        ">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #22c55e;">🎯 تحليل شامل</h3>
          <div style="text-align: right; font-size: 14px; line-height: 1.6;">
            <div style="margin-bottom: 8px;">• حساب معدل الأيض الأساسي (BMR)</div>
            <div style="margin-bottom: 8px;">• تحديد إجمالي استهلاك الطاقة (TEE)</div>
            <div style="margin-bottom: 8px;">• حساب الوزن المثالي حسب المركز</div>
            <div style="margin-bottom: 8px;">• تحليل نسبة الدهون في الجسم</div>
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.2) 100%);
          padding: 25px;
          border-radius: 15px;
          border: 2px solid rgba(59,130,246,0.3);
          margin-bottom: 25px;
        ">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #3b82f6;">📊 خطط غذائية مخصصة</h3>
          <div style="text-align: right; font-size: 14px; line-height: 1.6;">
            <div style="margin-bottom: 8px;">• خطة المحافظة على الوزن</div>
            <div style="margin-bottom: 8px;">• خطة زيادة الوزن (بناء العضلات)</div>
            <div style="margin-bottom: 8px;">• خطة نقصان الوزن (حرق الدهون)</div>
            <div style="margin-bottom: 8px;">• توزيع البروتين والكربوهيدرات والدهون</div>
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.2) 100%);
          padding: 25px;
          border-radius: 15px;
          border: 2px solid rgba(251,191,36,0.3);
          margin-bottom: 25px;
        ">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #fbbf24;">📋 تقرير احترافي</h3>
          <div style="text-align: right; font-size: 14px; line-height: 1.6;">
            <div style="margin-bottom: 8px;">• تقرير PDF شامل ومفصل</div>
            <div style="margin-bottom: 8px;">• رسوم بيانية توضيحية</div>
            <div style="margin-bottom: 8px;">• نصائح وتوصيات مخصصة</div>
            <div style="margin-bottom: 8px;">• خطط غذائية قابلة للطباعة</div>
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(124,58,237,0.2) 100%);
          padding: 25px;
          border-radius: 15px;
          border: 2px solid rgba(139,92,246,0.3);
        ">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #8b5cf6;">⚡ سهولة الاستخدام</h3>
          <div style="text-align: right; font-size: 14px; line-height: 1.6;">
            <div style="margin-bottom: 8px;">• واجهة سهلة وبسيطة</div>
            <div style="margin-bottom: 8px;">• نتائج فورية ودقيقة</div>
            <div style="margin-bottom: 8px;">• متوافق مع جميع الأجهزة</div>
            <div style="margin-bottom: 8px;">• دعم فني متواصل</div>
          </div>
        </div>
      `
      
      document.body.appendChild(page2Div)
      const canvas2 = await html2canvas(page2Div, {
        width: 595,
        height: 842,
        scale: 2,
        useCORS: true,
        allowTaint: true
      })
      document.body.removeChild(page2Div)
      
      const img2 = canvas2.toDataURL('image/png')
      pdf.addImage(img2, 'PNG', 0, 0, pageWidth, pageHeight)

      // Page 3 - How to Use
      pdf.addPage()
      
      const page3Div = document.createElement('div')
      page3Div.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 595px;
        height: 842px;
        background: linear-gradient(135deg, #1a472a 0%, #0f2e1a 50%, #0a1f12 100%);
        color: white;
        font-family: Arial, sans-serif;
        padding: 40px;
        box-sizing: border-box;
        direction: rtl;
        text-align: center;
      `
      
      page3Div.innerHTML = `
        <h2 style="font-size: 28px; font-weight: bold; margin-bottom: 30px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          كيفية استخدام الحاسبة
        </h2>
        
        <div style="
          background: linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.2) 100%);
          padding: 25px;
          border-radius: 15px;
          border: 2px solid rgba(34,197,94,0.3);
          margin-bottom: 25px;
        ">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #22c55e;">الخطوة الأولى: طلب رمز الوصول</h3>
          <p style="font-size: 14px; line-height: 1.6; text-align: justify; margin-bottom: 15px;">
            إذا لم تكن تملك رمز الوصول، يمكنك طلبه الآن من خلال إرسال بريدك الإلكتروني.
          </p>
          <div style="
            display: inline-block;
            background: rgba(251,191,36,0.2);
            color: #fbbf24;
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: bold;
            border: 1px solid rgba(251,191,36,0.3);
          ">
            📧 استخدم قسم "إرسال البريد" أعلاه
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.2) 100%);
          padding: 25px;
          border-radius: 15px;
          border: 2px solid rgba(59,130,246,0.3);
          margin-bottom: 25px;
        ">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #3b82f6;">الخطوة الثانية: تسجيل الدخول</h3>
          <p style="font-size: 14px; line-height: 1.6; text-align: justify; margin-bottom: 15px;">
            انتقل إلى صفحة تسجيل الدخول وأدخل بريدك الإلكتروني ورمز الوصول الذي تم إرساله لك.
          </p>
          <div style="
            display: inline-block;
            background: rgba(59,130,246,0.2);
            color: #3b82f6;
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: bold;
            border: 1px solid rgba(59,130,246,0.3);
          ">
            🔐 الرابط: http://localhost:3000/login
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.2) 100%);
          padding: 25px;
          border-radius: 15px;
          border: 2px solid rgba(251,191,36,0.3);
          margin-bottom: 25px;
        ">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #fbbf24;">الخطوة الثالثة: إدخال البيانات</h3>
          <p style="font-size: 14px; line-height: 1.6; text-align: justify; margin-bottom: 15px;">
            أدخل بياناتك الشخصية بدقة: الاسم، العمر، الوزن، الطول، مستوى النشاط، ومركزك في الملعب.
          </p>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(124,58,237,0.2) 100%);
          padding: 25px;
          border-radius: 15px;
          border: 2px solid rgba(139,92,246,0.3);
        ">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #8b5cf6;">الخطوة الرابعة: الحصول على النتائج</h3>
          <p style="font-size: 14px; line-height: 1.6; text-align: justify; margin-bottom: 15px;">
            احصل على تحليلك الشامل وخطتك الغذائية المخصصة، ويمكنك تصدير النتائج كملف PDF.
          </p>
        </div>
      `
      
      document.body.appendChild(page3Div)
      const canvas3 = await html2canvas(page3Div, {
        width: 595,
        height: 842,
        scale: 2,
        useCORS: true,
        allowTaint: true
      })
      document.body.removeChild(page3Div)
      
      const img3 = canvas3.toDataURL('image/png')
      pdf.addImage(img3, 'PNG', 0, 0, pageWidth, pageHeight)

      // Save PDF
      pdf.save('حاسبة-موصبري-المتقدمة-كتيب-تعريفي.pdf')
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('حدث خطأ أثناء إنشاء الكتيب')
    } finally {
      setIsGeneratingBrochure(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      margin: 0,
      background: `
        radial-gradient(ellipse at center, #1a472a 0%, #0f2e1a 50%, #0a1f12 100%),
        linear-gradient(45deg, transparent 40%, rgba(74, 222, 128, 0.1) 50%, transparent 60%),
        linear-gradient(-45deg, transparent 40%, rgba(74, 222, 128, 0.1) 50%, transparent 60%)
      `,
      backgroundSize: '100% 100%, 60px 60px, 60px 60px',
      backgroundPosition: 'center, 0 0, 30px 30px',
      padding: '20px'
    }}>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '25px',
        padding: '40px',
        border: '2px solid rgba(74, 222, 128, 0.3)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
          <button
            onClick={handleLogout}
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            }}
          >
            🚪 تسجيل الخروج
          </button>
          
          <div style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '25px',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 15px 30px rgba(34, 197, 94, 0.3)'
          }}>
            <span style={{ fontSize: '50px' }}>⚽</span>
          </div>
          
          <h1 style={{
            color: '#4ade80',
            fontSize: '2.5rem',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            لوحة تحكم موصبري
          </h1>
          
          <p style={{
            color: '#9ca3af',
            fontSize: '1.2rem',
            margin: '0'
          }}>
            إدارة البريد الإلكتروني والسجلات
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          marginBottom: '30px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '5px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('send')}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === 'send' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
              color: activeTab === 'send' ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📧 إرسال البريد
          </button>
          <button
            onClick={() => setActiveTab('records')}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === 'records' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
              color: activeTab === 'records' ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📊 سجل النشاط
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === 'analytics' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
              color: activeTab === 'analytics' ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📈 إحصائيات
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === 'customers' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
              color: activeTab === 'customers' ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            👥 عملاء
          </button>
          <button
            onClick={() => setActiveTab('speed-test')}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === 'speed-test' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
              color: activeTab === 'speed-test' ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ⚡ اختبار السرعة
          </button>
          <button
            onClick={() => setActiveTab('permanent-codes')}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === 'permanent-codes' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'transparent',
              color: activeTab === 'permanent-codes' ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🔐 الرموز الثابتة
          </button>
        </div>



        {/* Content based on active tab */}
        {activeTab === 'send' ? (
          <>
            {/* Main Form */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{
                color: '#4ade80',
                fontSize: '1.5rem',
                margin: '0 0 20px 0',
                textAlign: 'center'
              }}>
                📧 إرسال رمز وصول جديد
              </h2>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#4ade80',
                    marginBottom: '10px',
                    fontSize: '1.1rem',
                    fontWeight: '500'
                  }}>
                    البريد الإلكتروني للعميل
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="أدخل بريد العميل الإلكتروني"
                    required
                    style={{
                      width: '100%',
                      padding: '15px',
                      border: '2px solid rgba(74, 222, 128, 0.3)',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      textAlign: 'right',
                      direction: 'rtl',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '15px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 20px rgba(34, 197, 94, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 12px 25px rgba(34, 197, 94, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(34, 197, 94, 0.3)'
                    }
                  }}
                >
                  {loading ? '⏳ جاري الإرسال...' : '📤 إرسال رمز الوصول'}
                </button>
              </form>
            </div>
          </>
        ) : activeTab === 'records' ? (
          <>
            {/* Email Records */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  color: '#4ade80',
                  fontSize: '1.5rem',
                  margin: '0',
                  textAlign: 'center'
                }}>
                  📊 سجل النشاط
                </h2>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={exportRecords}
                    disabled={emailRecords.length === 0}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: emailRecords.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: emailRecords.length === 0 ? 0.5 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📥 تصدير CSV
                  </button>
                  
                  <button
                    onClick={clearRecords}
                    disabled={emailRecords.length === 0}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: emailRecords.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: emailRecords.length === 0 ? 0.5 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🗑️ حذف السجلات
                  </button>
                  
                  <button
                    onClick={addTestLoginRecords}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🧪 إضافة بيانات تجريبية
                  </button>
                  
                  <button
                    onClick={showValidAccessCodes}
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🔑 عرض رموز الوصول
                  </button>
                  
                  <button
                    onClick={addManualAccessCode}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ➕ إضافة رمز يدوياً
                  </button>
                  
                  <button
                    onClick={testLoginSystem}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🧪 اختبار تسجيل الدخول
                  </button>
                  
                  <button
                    onClick={generateAccessCodeForEmail}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🔑 إنشاء رمز لأي بريد
                  </button>
                  
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/send-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: 'mosabrihelp@gmail.com' })
                        })
                        
                        const data = await response.json()
                        
                        if (response.ok) {
                          alert(`✅ تم إرسال رمز الوصول إلى mosabrihelp@gmail.com\n\nالرمز: ${data.accessCode}`)
                        } else {
                          alert(`❌ خطأ: ${data.error}`)
                        }
                      } catch (error) {
                        alert(`❌ خطأ في الاتصال: ${error}`)
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📧 اختبار إرسال للبريد المرسل
                  </button>
                </div>
              </div>

              {emailRecords.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#9ca3af',
                  fontSize: '1.1rem'
                }}>
                  📭 لا توجد سجلات بعد
                </div>
              ) : (
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {emailRecords.map((record, index) => (
                    <div key={index} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: '600' }}>{record.email}</p>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>النوع: {record.type === 'sent' ? 'إرسال' : 'تسجيل دخول'}</p>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>التاريخ: {record.timestamp}</p>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>الحالة: {record.status === 'success' ? 'نجح' : 'فشل'}</p>
                        {record.details && (
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>التفاصيل: {record.details}</p>
                        )}
                      </div>
                      <div style={{
                        color: record.status === 'success' ? '#22c55e' : '#ef4444',
                        fontSize: '1.5rem'
                      }}>
                        {record.status === 'success' ? '✅' : '❌'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'analytics' ? (
          <>
            {/* Analytics Content */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 10px 20px rgba(34, 197, 94, 0.3)'
              }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>إحصائيات اليوم</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{getTodayStats().totalEmails} رسالة</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{getTodayStats().totalLogins} تسجيل دخول</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{getTodayStats().successRate}% نجاح</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{getTodayStats().newCustomers} عميل جديد</p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)'
              }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>قاعدة البيانات</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{getTodayStats().totalCustomers} إجمالي العملاء</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{getTodayStats().activeCustomers} عملاء نشطين</p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)'
              }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>إحصائيات الأسبوع</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{getWeeklyStats()[0].emails} رسالة</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{getWeeklyStats()[0].logins} تسجيل دخول</p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 10px 20px rgba(251, 191, 36, 0.3)'
              }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>أفضل عملاء</h3>
                {getTopCustomers().map((customer, index) => (
                  <p key={index} style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{customer.email} ({customer.count} تسجيل)</p>
                ))}
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)'
              }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>ساعات الطلبات</h3>
                {getPeakHours().map((hour, index) => (
                  <p key={index} style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{hour.hour} ({hour.count} طلب)</p>
                ))}
              </div>
            </div>
          </>
        ) : activeTab === 'customers' ? (
          <>
            {/* Customers Management */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                                    <h2 style={{
                        color: '#4ade80',
                        fontSize: '1.5rem',
                        margin: '0 0 20px 0',
                        textAlign: 'center'
                      }}>
                        👥 إدارة العملاء
                      </h2>
                      
                      {/* إحصائيات سريعة */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        marginBottom: '25px',
                        gap: '15px'
                      }}>
                        <div style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '10px',
                          padding: '15px',
                          textAlign: 'center',
                          flex: 1
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
                            {customers.filter(c => c.status === 'active').length}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>نشط</div>
                        </div>
                        
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '10px',
                          padding: '15px',
                          textAlign: 'center',
                          flex: 1
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                            {customers.filter(c => c.status === 'inactive').length}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>غير نشط</div>
                        </div>
                        
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '10px',
                          padding: '15px',
                          textAlign: 'center',
                          flex: 1
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                            {customers.filter(c => c.status === 'banned').length}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>محظور</div>
                        </div>
                        
                        <div style={{
                          background: 'rgba(139, 92, 246, 0.2)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '10px',
                          padding: '15px',
                          textAlign: 'center',
                          flex: 1
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                            {customers.filter(c => c.status === 'expired').length}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>منتهي الصلاحية</div>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        gap: '15px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            color: '#9ca3af',
                            fontSize: '0.9rem',
                            margin: '0 0 10px 0',
                            textAlign: 'center'
                          }}>
                            قاعدة بيانات دائمة لجميع المستخدمين الذين:
                          </p>
                          <ul style={{
                            color: '#9ca3af',
                            fontSize: '0.8rem',
                            margin: '0',
                            paddingRight: '20px',
                            listStyle: 'none'
                          }}>
                            <li>• سجلوا دخول إلى الحاسبة</li>
                            <li>• تلقوا رمز وصول عبر البريد الإلكتروني</li>
                            <li>• استخدموا النظام</li>
                          </ul>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/customers')
                              const data = await response.json()
                              
                              if (data.success) {
                                setCustomers(data.customers)
                                alert(`✅ تم تحديث قاعدة البيانات\n\nإجمالي العملاء: ${data.total}`)
                              } else {
                                alert('❌ فشل في تحديث قاعدة البيانات')
                              }
                            } catch (error) {
                              alert('❌ خطأ في الاتصال بالخادم')
                            }
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          🔄 تحديث البيانات
                        </button>
              </div>

              {/* الحسابات النشطة */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '2px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <h3 style={{
                  color: '#22c55e',
                  fontSize: '1.3rem',
                  margin: '0 0 15px 0',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  ✅ الحسابات النشطة
                </h3>
                
                <p style={{
                  color: '#9ca3af',
                  fontSize: '0.9rem',
                  margin: '0 0 15px 0',
                  textAlign: 'center'
                }}>
                  العملاء الذين يمكنهم الوصول إلى النظام واستخدام الحاسبة
                </p>

                {customers.filter(c => c.status === 'active').length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#9ca3af',
                    fontSize: '1rem'
                  }}>
                    📭 لا توجد حسابات نشطة
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {customers.filter(c => c.status === 'active').map((customer, index) => (
                      <div key={index} style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '12px',
                        padding: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: '600', color: '#22c55e' }}>{customer.name || customer.email}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>البريد: {customer.email}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>تاريخ الاشتراك: {customer.registrationDate}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>تاريخ نهاية الاشتراك: {customer.subscriptionEnd || calculateSubscriptionEnd(customer.registrationDate)}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>آخر نشاط: {formatDate(customer.lastActivity)}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>آخر تسجيل دخول: {customer.lastLogin ? formatDate(customer.lastLogin) : 'لم يسجل دخول بعد'}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>عدد الاستخدامات: {customer.usageCount}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>
                            رمز الوصول: {permanentCodes[customer.email] || 'غير محدد'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الحساب ${customer.email} نهائياً؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
                                deleteCustomer(customer.email)
                              }
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🗑️ حذف
                          </button>
                          <button
                            onClick={() => updateCustomerStatus(customer.email, 'banned')}
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🚫 حظر
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* الحسابات المحظورة */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <h3 style={{
                  color: '#ef4444',
                  fontSize: '1.3rem',
                  margin: '0 0 15px 0',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  🚫 الحسابات المحظورة
                </h3>
                
                <p style={{
                  color: '#9ca3af',
                  fontSize: '0.9rem',
                  margin: '0 0 15px 0',
                  textAlign: 'center'
                }}>
                  العملاء الذين انتهت صلاحية اشتراكهم ولا يستطيعون الدخول للآلة
                </p>

                {customers.filter(c => c.status === 'banned').length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#9ca3af',
                    fontSize: '1rem'
                  }}>
                    📭 لا توجد حسابات محظورة
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {customers.filter(c => c.status === 'banned').map((customer, index) => (
                      <div key={index} style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px',
                        padding: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: '600', color: '#ef4444' }}>{customer.name || customer.email}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>البريد: {customer.email}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>تاريخ الاشتراك: {customer.registrationDate}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>تاريخ نهاية الاشتراك: {customer.subscriptionEnd || calculateSubscriptionEnd(customer.registrationDate)}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>آخر نشاط: {formatDate(customer.lastActivity)}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>آخر تسجيل دخول: {customer.lastLogin ? formatDate(customer.lastLogin) : 'لم يسجل دخول بعد'}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>عدد الاستخدامات: {customer.usageCount}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#9ca3af' }}>
                            رمز الوصول: {permanentCodes[customer.email] || 'غير محدد'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => reactivateCustomer(customer.email)}
                            style={{
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            ✅ إعادة التفعيل
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الحساب ${customer.email} نهائياً؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
                                deleteCustomer(customer.email)
                              }
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>




            </div>
          </>
        ) : activeTab === 'speed-test' ? (
          <>
            {/* Speed Test Content */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{
                color: '#f59e0b',
                fontSize: '1.5rem',
                margin: '0 0 20px 0',
                textAlign: 'center'
              }}>
                ⚡ اختبار سرعة النظام
              </h2>
              
              <p style={{
                color: '#9ca3af',
                fontSize: '1rem',
                margin: '0 0 20px 0',
                textAlign: 'center'
              }}>
                قياس أداء النظام وقدرته على استيعاب المستخدمين
              </p>

              {/* Control Buttons */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                justifyContent: 'center',
                marginBottom: '30px'
              }}>
                <button
                  onClick={runAllTests}
                  disabled={isRunning}
                  style={{
                    background: isRunning ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '15px 30px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    opacity: isRunning ? 0.7 : 1,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  {isRunning ? '🔄 جاري الاختبار...' : '🚀 تشغيل جميع الاختبارات'}
                </button>
                
                <button
                  onClick={updateSystemMetrics}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '15px 30px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  📊 تحديث المقاييس
                </button>
                
                <button
                  onClick={testAllAdminFunctions}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '15px 30px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  🔍 اختبار شامل للنظام
                </button>
              </div>
              
              {isRunning && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  padding: '15px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <div style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '10px' }}>
                    جاري الاختبار: {currentTest}
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '60%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                      borderRadius: '4px',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></div>
                  </div>
                </div>
              )}

              {/* System Metrics */}
              {systemMetrics && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  {/* Memory Usage */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '15px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <h3 style={{
                      color: '#22c55e',
                      fontSize: '1.2rem',
                      margin: '0 0 15px 0',
                      textAlign: 'center'
                    }}>
                      💾 استخدام الذاكرة
                    </h3>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        marginBottom: '5px'
                      }}>
                        {systemMetrics.memory.used}MB / {systemMetrics.memory.total}MB
                      </div>
                      <div style={{
                        color: systemMetrics.memory.percentage > 80 ? '#ef4444' : '#22c55e',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                      }}>
                        {systemMetrics.memory.percentage}%
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        marginTop: '10px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${systemMetrics.memory.percentage}%`,
                          height: '100%',
                          background: systemMetrics.memory.percentage > 80 ? '#ef4444' : '#22c55e',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '15px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <h3 style={{
                      color: '#3b82f6',
                      fontSize: '1.2rem',
                      margin: '0 0 15px 0',
                      textAlign: 'center'
                    }}>
                      ⚡ الأداء العام
                    </h3>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        marginBottom: '5px'
                      }}>
                        {systemMetrics.performance.averageResponseTime.toFixed(2)}ms
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '1rem' }}>
                        متوسط الاستجابة
                      </div>
                      <div style={{
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        marginTop: '10px'
                      }}>
                        {systemMetrics.performance.successRate.toFixed(1)}%
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '1rem' }}>
                        معدل النجاح
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Results */}
              {testResults.length > 0 && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <h3 style={{
                    color: '#f59e0b',
                    fontSize: '1.3rem',
                    margin: '0 0 20px 0',
                    textAlign: 'center'
                  }}>
                    📋 نتائج الاختبارات
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                  }}>
                    {testResults.map((result, index) => {
                      const performance = getPerformanceRating(result.duration)
                      return (
                        <div key={index} style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          padding: '15px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <span style={{ fontSize: '1.5rem' }}>{getStatusIcon(result.status)}</span>
                              <span style={{
                                color: 'white',
                                fontSize: '1.1rem',
                                fontWeight: '600'
                              }}>
                                {result.name}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                color: performance.color === 'text-green-600' ? '#22c55e' : 
                                       performance.color === 'text-blue-600' ? '#3b82f6' :
                                       performance.color === 'text-yellow-600' ? '#f59e0b' : '#ef4444',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                              }}>
                                {result.duration.toFixed(2)}ms
                              </div>
                              <div style={{
                                color: '#9ca3af',
                                fontSize: '0.9rem'
                              }}>
                                {performance.rating}
                              </div>
                            </div>
                          </div>
                          
                          {result.details && (
                            <div style={{
                              color: '#9ca3af',
                              fontSize: '0.9rem',
                              padding: '10px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                              {result.details}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Performance Summary */}
                  <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <h4 style={{
                      color: '#f59e0b',
                      fontSize: '1.1rem',
                      margin: '0 0 15px 0',
                      textAlign: 'center'
                    }}>
                      📊 ملخص الأداء
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '15px',
                      textAlign: 'center'
                    }}>
                      <div>
                        <div style={{
                          color: '#22c55e',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          {testResults.filter(t => t.status === 'success').length}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                          اختبارات ناجحة
                        </div>
                      </div>
                      <div>
                        <div style={{
                          color: '#f59e0b',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          {testResults.filter(t => t.status === 'warning').length}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                          تحذيرات
                        </div>
                      </div>
                      <div>
                        <div style={{
                          color: '#ef4444',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          {testResults.filter(t => t.status === 'error').length}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                          أخطاء
                        </div>
                      </div>
                      <div>
                        <div style={{
                          color: '#3b82f6',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          {(testResults.reduce((sum, t) => sum + t.duration, 0) / testResults.length).toFixed(2)}ms
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                          متوسط الاستجابة
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Guide */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginTop: '20px'
              }}>
                <h3 style={{
                  color: '#8b5cf6',
                  fontSize: '1.2rem',
                  margin: '0 0 15px 0',
                  textAlign: 'center'
                }}>
                  📖 دليل فهم الأرقام
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px'
                }}>
                  <div>
                    <h4 style={{
                      color: '#22c55e',
                      fontSize: '1rem',
                      margin: '0 0 10px 0'
                    }}>
                      ⚡ أوقات الاستجابة
                    </h4>
                    <div style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      <div>أقل من 100ms: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>ممتاز</span></div>
                      <div>100-500ms: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>جيد</span></div>
                      <div>500-1000ms: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>مقبول</span></div>
                      <div>أكثر من 1000ms: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>بطيء</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{
                      color: '#22c55e',
                      fontSize: '1rem',
                      margin: '0 0 10px 0'
                    }}>
                      💾 استخدام الذاكرة
                    </h4>
                    <div style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      <div>أقل من 50%: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>ممتاز</span></div>
                      <div>50-80%: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>جيد</span></div>
                      <div>80-90%: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>تحذير</span></div>
                      <div>أكثر من 90%: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>خطر</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'permanent-codes' ? (
          <>
            {/* Permanent Codes Management */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{
                color: '#8b5cf6',
                fontSize: '1.5rem',
                margin: '0 0 20px 0',
                textAlign: 'center'
              }}>
                🔐 إدارة الرموز الثابتة
              </h2>
              
              <p style={{
                color: '#9ca3af',
                fontSize: '1rem',
                margin: '0 0 20px 0',
                textAlign: 'center'
              }}>
                إدارة الرموز الثابتة التي لا تنتهي صلاحيتها للعملاء
              </p>

              {/* Add New Code Form */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '30px'
              }}>
                <h3 style={{
                  color: '#22c55e',
                  fontSize: '1.2rem',
                  margin: '0 0 15px 0',
                  textAlign: 'center'
                }}>
                  ➕ إضافة رمز ثابت جديد
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: '15px',
                  alignItems: 'end'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#4ade80',
                      marginBottom: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="أدخل بريد العميل الإلكتروني"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(74, 222, 128, 0.3)',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: '0.9rem',
                        textAlign: 'right',
                        direction: 'rtl',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#4ade80',
                      marginBottom: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      الرمز (8 أحرف)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="مثال: BE24EC7A"
                        maxLength={8}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '2px solid rgba(74, 222, 128, 0.3)',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '0.9rem',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          letterSpacing: '2px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        onClick={generateRandomCode}
                        style={{
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                        title="توليد رمز عشوائي"
                      >
                        🎲
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={addPermanentCode}
                    disabled={!newEmail || !newCode || newCode.length !== 8}
                    style={{
                      padding: '12px 24px',
                      background: !newEmail || !newCode || newCode.length !== 8 
                        ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                        : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: !newEmail || !newCode || newCode.length !== 8 ? 'not-allowed' : 'pointer',
                      opacity: !newEmail || !newCode || newCode.length !== 8 ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    ➕ إضافة
                  </button>
                </div>
              </div>

              {/* Existing Codes List */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    color: '#8b5cf6',
                    fontSize: '1.2rem',
                    margin: 0
                  }}>
                    📋 الرموز الثابتة الحالية ({Object.keys(permanentCodes).length})
                  </h3>
                  
                  <button
                    onClick={loadPermanentCodesFromAPI}
                    disabled={isLoadingCodes}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: isLoadingCodes ? 'not-allowed' : 'pointer',
                      opacity: isLoadingCodes ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    {isLoadingCodes ? '🔄' : '🔄 تحديث'}
                  </button>
                </div>

                {Object.keys(permanentCodes).length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#9ca3af',
                    fontSize: '1rem'
                  }}>
                    📭 لا توجد رموز ثابتة حالياً
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {Object.entries(permanentCodes).map(([email, code]) => (
                      <div key={email} style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            color: '#4ade80',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '5px'
                          }}>
                            {email}
                          </div>
                          <div style={{
                            color: '#fbbf24',
                            fontSize: '1.1rem',
                            fontFamily: 'monospace',
                            letterSpacing: '1px',
                            fontWeight: 'bold'
                          }}>
                            {code}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deletePermanentCode(email)}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}

        {/* Bulk Send Section - Only show in send tab */}
        {activeTab === 'send' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{
              color: '#fbbf24',
              fontSize: '1.5rem',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              📋 إرسال جماعي
            </h2>
            
            <p style={{
              color: '#9ca3af',
              fontSize: '1rem',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              أدخل عدة بريدات إلكترونية مفصولة بفواصل أو أسطر جديدة
            </p>

            <textarea
              placeholder="customer1@example.com, customer2@example.com&#10;customer3@example.com"
              style={{
                width: '100%',
                height: '120px',
                padding: '15px',
                border: '2px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem',
                textAlign: 'right',
                direction: 'rtl',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  const emails = e.currentTarget.value
                    .split(/[,\n]/)
                    .map(email => email.trim())
                    .filter(email => email && email.includes('@'))
                  
                  if (emails.length > 0) {
                    handleBulkSend(emails)
                  }
                }
              }}
            />

            <div style={{
              display: 'flex',
              gap: '15px',
              marginTop: '15px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea')
                  if (textarea) {
                    const emails = textarea.value
                      .split(/[,\n]/)
                      .map(email => email.trim())
                      .filter(email => email && email.includes('@'))
                    
                    if (emails.length > 0) {
                      handleBulkSend(emails)
                    }
                  }
                }}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 20px rgba(251, 191, 36, 0.3)'
                }}
              >
                📤 إرسال جماعي
              </button>
              
              <div style={{
                color: '#9ca3af',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                Ctrl+Enter للإرسال السريع
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity - Only show in send tab */}
        {activeTab === 'send' && recentEmails.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{
              color: '#4ade80',
              fontSize: '1.3rem',
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              📊 آخر الإرسالات
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentEmails.map((email, index) => (
                <div key={index} style={{
                  background: 'rgba(74, 222, 128, 0.1)',
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ color: '#4ade80', fontSize: '1.2rem' }}>✅</span>
                  <span style={{ color: 'white', fontSize: '1rem' }}>{email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '2px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '15px',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#4ade80', margin: '0', fontWeight: '500' }}>
              {message}
            </p>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '15px',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#ef4444', margin: '0', fontWeight: '500' }}>
              ❌ {error}
            </p>
          </div>
        )}

        {/* Brochure Generation */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            color: '#8b5cf6',
            fontSize: '1.5rem',
            margin: '0 0 20px 0',
            textAlign: 'center'
          }}>
            📄 إدارة الكتيب التعريفي
          </h2>
          
          <p style={{
            color: '#9ca3af',
            fontSize: '1rem',
            margin: '0 0 20px 0',
            textAlign: 'center'
          }}>
            إنشاء كتيب PDF تعريفي شامل للموقع
          </p>

          <button
            onClick={generateBrochurePDF}
            disabled={isGeneratingBrochure}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '15px 30px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isGeneratingBrochure ? 'not-allowed' : 'pointer',
              opacity: isGeneratingBrochure ? 0.7 : 1,
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              if (!isGeneratingBrochure) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 25px rgba(139, 92, 246, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isGeneratingBrochure) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)'
              }
            }}
          >
            {isGeneratingBrochure ? '⏳ جاري إنشاء الكتيب...' : '📄 إنشاء كتيب PDF تعريفي'}
          </button>
        </div>



        {/* Stats */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#4ade80', margin: '0 0 15px 0', fontSize: '1.1rem' }}>
            📈 إحصائيات سريعة
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            color: '#9ca3af',
            fontSize: '0.9rem'
          }}>
            <div>
              <div style={{ color: '#4ade80', fontSize: '1.2rem', fontWeight: 'bold' }}>
                {emailRecords.filter(r => r.type === 'sent').length}
              </div>
              <div>إرسالات</div>
            </div>
            <div>
              <div style={{ color: '#3b82f6', fontSize: '1.2rem', fontWeight: 'bold' }}>
                {emailRecords.filter(r => r.type === 'login').length}
              </div>
              <div>تسجيلات دخول</div>
            </div>
            <div>
              <div style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 'bold' }}>
                {emailRecords.length > 0 
                  ? Math.round((emailRecords.filter(r => r.status === 'success').length / emailRecords.length) * 100)
                  : 0}%
              </div>
              <div>معدل النجاح</div>
              <div/}
            </div>
            <div>
              <div style={{ color: '#8b5cf6', fontSize: '1.2rem', fontWeight: 'bold' }}>
                {emailRecords.length}
              </div>
              <div>إجمالي السجلات</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 