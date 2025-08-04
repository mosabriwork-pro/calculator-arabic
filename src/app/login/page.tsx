'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Disable SSR for this component to prevent hydration issues
const LoginPage = dynamic(() => Promise.resolve(() => {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Basic validation
    if (!email.trim() || !code.trim()) {
      alert('يرجى إدخال البريد الإلكتروني ورمز الوصول')
      setIsLoading(false)
      return
    }
    
    // Rate limiting check
    const lastAttempt = localStorage.getItem('lastLoginAttempt')
    const now = Date.now()
    if (lastAttempt && (now - parseInt(lastAttempt)) < 5000) {
      alert('يرجى الانتظار 5 ثوانٍ قبل المحاولة مرة أخرى')
      setIsLoading(false)
      return
    }
    localStorage.setItem('lastLoginAttempt', now.toString())
    
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
        localStorage.setItem('userEmail', email)
        
        // Log successful login
        const loginRecord = {
          email,
          timestamp: new Date().toLocaleString('ar-SA'),
          type: 'login',
          status: 'success',
          details: 'تم تسجيل الدخول بنجاح'
        }
        
        const existingRecords = JSON.parse(localStorage.getItem('emailRecords') || '[]')
        existingRecords.unshift(loginRecord)
        localStorage.setItem('emailRecords', JSON.stringify(existingRecords.slice(0, 99)))
        
        window.location.href = '/calculator'
      } else {
        // Log failed login
        const loginRecord = {
          email,
          timestamp: new Date().toLocaleString('ar-SA'),
          type: 'login',
          status: 'failed',
          details: data.error || 'فشل في تسجيل الدخول'
        }
        
        const existingRecords = JSON.parse(localStorage.getItem('emailRecords') || '[]')
        existingRecords.unshift(loginRecord)
        localStorage.setItem('emailRecords', JSON.stringify(existingRecords.slice(0, 99)))
        
        // Show appropriate error message
        if (response.status === 403) {
          // Account banned or inactive
          alert(`${data.error}\n\nالبريد: ${email}\n\nيرجى التواصل مع الإدارة لحل المشكلة.`)
        } else {
          // Invalid code or other error
          alert(`${data.error || 'رمز الوصول غير صحيح'}\n\nالبريد: ${email}\nالرمز المدخل: ${code}\n\nيرجى التأكد من الرمز المرسل إلى بريدك الإلكتروني`)
        }
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.')
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a472a 0%, #0f2e1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          color: 'white',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            margin: '0 0 20px 0'
          }}>
            تسجيل الدخول
          </h1>
          <p style={{
            fontSize: '1.2rem',
            margin: 0,
            opacity: 0.9
          }}>
            مرحباً بك في حاسبة لاعب كرة القدم
          </p>
        </div>

        {/* Form */}
        <div style={{
          padding: '40px'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: 'bold',
                color: '#374151',
                fontSize: '1.1rem'
              }}>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '10px',
                  border: '2px solid #d1d5db',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  boxSizing: 'border-box'
                }}
                placeholder="أدخل بريدك الإلكتروني"
                required
              />
            </div>

            {/* Code Field */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: 'bold',
                color: '#374151',
                fontSize: '1.1rem'
              }}>
                رمز الوصول
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '10px',
                  border: '2px solid #d1d5db',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  boxSizing: 'border-box'
                }}
                placeholder="أدخل رمز الوصول"
                required
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                padding: '15px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {isLoading && (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              )}
              {isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Warnings */}
          <div style={{
            marginTop: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{
              background: '#fef2f2',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              padding: '15px',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#dc2626',
                fontSize: '0.9rem',
                margin: 0,
                fontWeight: '500'
              }}>
                ⚠️ يجب أن تدخل البريد الإلكتروني الذي اشتريت به المنتج في متجر موصبري
              </p>
            </div>

            <div style={{
              background: '#fff7ed',
              border: '1px solid #f97316',
              borderRadius: '10px',
              padding: '15px',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#ea580c',
                fontSize: '0.9rem',
                margin: 0,
                fontWeight: '500'
              }}>
                ⏰ خلال 24 ساعة سيتم إرسال رمز الوصول إلى بريدك الإلكتروني
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}), { ssr: false })

export default LoginPage