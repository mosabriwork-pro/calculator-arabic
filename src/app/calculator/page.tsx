'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Chart.js components
const Pie = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Pie })), { ssr: false })
const Bar = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })), { ssr: false })

interface PlayerData {
  name: string
  age: number
  weight: number
  height: number
  position: string
  activityLevel: string
}

interface NutritionPlan {
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
  idealWeight: {
    min: number
    max: number
  }
}

// Disable SSR for the entire calculator component
const Calculator = dynamic(() => Promise.resolve(() => {
  const [playerData, setPlayerData] = useState<PlayerData>({
    name: '',
    age: 9,
    weight: 30,
    height: 175,
    position: 'مهاجم',
    activityLevel: 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
  })

  const [isCalculating, setIsCalculating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'maintain' | 'gain' | 'lose'>('maintain')
  const [mounted, setMounted] = useState(false)
  const [chartsReady, setChartsReady] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    setMounted(true)
    
    // Load saved data from localStorage with better error handling
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem('calculatorData')
        if (savedData) {
          const parsed = JSON.parse(savedData)
          // Validate the parsed data before setting it
          if (parsed && typeof parsed === 'object') {
            setPlayerData(prev => ({
              ...prev,
              name: parsed.name || '',
              age: typeof parsed.age === 'number' && parsed.age >= 9 && parsed.age <= 65 ? parsed.age : 9,
              weight: typeof parsed.weight === 'number' && parsed.weight >= 20 && parsed.weight <= 200 ? parsed.weight : 30,
              height: typeof parsed.height === 'number' && parsed.height >= 100 && parsed.height <= 250 ? parsed.height : 175,
              position: parsed.position || 'مهاجم',
              activityLevel: parsed.activityLevel || 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
            }))
          }
        }

        const savedPlan = localStorage.getItem('selectedPlan')
        if (savedPlan && ['maintain', 'gain', 'lose'].includes(savedPlan)) {
          setSelectedPlan(savedPlan as 'maintain' | 'gain' | 'lose')
        }
      } catch (error) {
        console.error('Error loading saved data:', error)
        // Clear corrupted data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('calculatorData')
          localStorage.removeItem('selectedPlan')
        }
      }
    }
    
    // Initialize Chart.js when component mounts
    const initCharts = async () => {
      if (typeof window !== 'undefined') {
        try {
          const { Chart: ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } = await import('chart.js/auto')
          ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)
          setChartsReady(true)
        } catch (error) {
          console.error('Error initializing Chart.js:', error)
        }
      }
    }
    
    initCharts()
  }, [])

  // Save data to localStorage whenever it changes with better error handling
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('calculatorData', JSON.stringify(playerData))
        localStorage.setItem('selectedPlan', selectedPlan)
      } catch (error) {
        console.error('Error saving data to localStorage:', error)
      }
    }
  }, [playerData, selectedPlan, mounted])



  // Validation function
  const validateInputs = () => {
    const errors: string[] = []
    
    if (!playerData.name.trim()) {
      errors.push('يرجى إدخال اسم اللاعب')
    }
    
    if (playerData.age < 9 || playerData.age > 65) {
      errors.push('العمر يجب أن يكون بين 9 و 65 سنة')
    }
    
    if (playerData.weight < 20 || playerData.weight > 200) {
      errors.push('الوزن يجب أن يكون بين 20 و 200 كجم')
    }
    
    if (playerData.height < 100 || playerData.height > 250) {
      errors.push('الطول يجب أن يكون بين 100 و 250 سم')
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  // Calculate ideal weight
  const calculateIdealWeight = (height: number, position: string) => {
    const baseWeight = height - 100
    let minWeight = baseWeight * 0.9
    let maxWeight = baseWeight * 1.1
    
    // Adjust based on position
    switch (position) {
      case 'حارس مرمى':
        minWeight *= 1.05
        maxWeight *= 1.15
        break
      case 'مدافع':
        minWeight *= 1.02
        maxWeight *= 1.08
        break
      case 'محور':
        minWeight *= 0.98
        maxWeight *= 1.02
        break
      case 'مهاجم':
        minWeight *= 0.95
        maxWeight *= 0.98
        break
    }
    
    return {
      min: Math.round(minWeight),
      max: Math.round(maxWeight)
    }
  }

  // Calculate nutrition plan
  const nutritionPlan = useMemo(() => {
    // Calculate BMR
    const bmr = 10 * playerData.weight + 6.25 * playerData.height - 5 * playerData.age + 5
    
    // Activity multipliers
    const activityMultipliers = {
      'كسول (بدون تمرين)': 1.2,
      'نشاط خفيف (1-2 يوم تمرين اسبوعيا)': 1.375,
      'نشاط متوسط (3-4 أيام تمرين اسبوعيا)': 1.55,
      'نشاط عالي (5-6 أيام تمرين اسبوعيا)': 1.725,
      'نشاط مكثف (تمرين يومي + نشاط بدني)': 1.9
    }
    
    // Position multipliers
    const positionMultipliers = {
      'حارس مرمى': 1.1,
      'مدافع': 1.15,
      'محور': 1.2,
      'مهاجم': 1.25
    }
    
    // Calculate base calories
    let baseCalories = bmr * 
      activityMultipliers[playerData.activityLevel as keyof typeof activityMultipliers] * 
      positionMultipliers[playerData.position as keyof typeof positionMultipliers]
    
    // Calculate maintain plan
    const maintainCalories = Math.round(baseCalories)
    const maintainProtein = Math.round(maintainCalories * 0.25 / 4)
    const maintainFat = Math.round(maintainCalories * 0.25 / 9)
    const maintainCarbs = Math.round((maintainCalories - (maintainProtein * 4) - (maintainFat * 9)) / 4)
    
    // Apply plan adjustments
    let totalCalories = maintainCalories
    let protein = maintainProtein
    let fat = maintainFat
    let carbs = maintainCarbs
    let caloriesAdjustment = 0
    let carbsAdjustment = 0
    
    if (selectedPlan === 'gain') {
      if (playerData.age >= 9 && playerData.age <= 12) {
        caloriesAdjustment = 150
        carbsAdjustment = 40
      } else if (playerData.age >= 13 && playerData.age <= 18) {
        caloriesAdjustment = 300
        carbsAdjustment = 75
      } else if (playerData.age > 18) {
        caloriesAdjustment = 400
        carbsAdjustment = 100
      }
    } else if (selectedPlan === 'lose') {
      if (playerData.age >= 9 && playerData.age <= 12) {
        caloriesAdjustment = -150
        carbsAdjustment = -40
      } else if (playerData.age >= 13 && playerData.age <= 18) {
        caloriesAdjustment = -300
        carbsAdjustment = -75
      } else if (playerData.age > 18) {
        caloriesAdjustment = -400
        carbsAdjustment = -100
      }
    }
    
    totalCalories += caloriesAdjustment
    carbs += carbsAdjustment
    
    // Water calculation
    const water = Math.round(playerData.weight * 0.04 * 100) / 100
    
    // Ideal weight
    const idealWeight = calculateIdealWeight(playerData.height, playerData.position)
    
    return {
      calories: totalCalories,
      protein,
      carbs,
      fat,
      water,
      idealWeight,
      baseCalories: maintainCalories,
      caloriesAdjustment,
      carbsAdjustment
    }
  }, [playerData, selectedPlan])

  // Handle calculate button click
  const handleCalculate = () => {
    try {
      if (validateInputs()) {
        setIsCalculating(true)
        setShowResults(true)
        
        // Simulate calculation delay
        setTimeout(() => {
          setIsCalculating(false)
          // Scroll to results
          if (typeof window !== 'undefined') {
            document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Error in handleCalculate:', error)
      setIsCalculating(false)
      alert('حدث خطأ أثناء الحساب. يرجى المحاولة مرة أخرى.')
    }
  }

  // Export to PDF
  // دالة اختبار بسيطة للتصدير
  const testExport = async () => {
    setIsExporting(true)
    try {
      const html2pdf = await import('html2pdf.js')
      
      // إنشاء عنصر بسيط مباشر في الصفحة
      const testDiv = document.createElement('div')
      testDiv.id = 'test-export-element'
      testDiv.innerHTML = `
        <div style="
          font-family: 'Cairo', sans-serif;
          background: #f0f9ff;
          border: 2px solid #22c55e;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          width: 400px;
          margin: 20px auto;
        ">
          <h1 style="color: #1a472a; font-size: 24px; margin-bottom: 15px;">اختبار التصدير إلى PDF</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">هذا نص عربي بسيط لاختبار تصدير PDF</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">اسم اللاعب: ${playerData.name || 'لم يتم إدخال الاسم'}</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">الوزن: ${playerData.weight} كجم</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">الطول: ${playerData.height} سم</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      `
      
      // إضافة العنصر للصفحة بشكل مرئي
      document.body.appendChild(testDiv)
      
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `test_export_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          logging: true,
          removeContainer: false
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        }
      }
      
      // انتظار قصير لتحميل الخطوط
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // تصدير العنصر المرئي
      await html2pdf.default().from(testDiv).set(opt).save()
      
      // إزالة العنصر من الصفحة
      document.body.removeChild(testDiv)
      
      alert('تم إنشاء ملف اختبار بنجاح!')
    } catch (error) {
      console.error('Error in test export:', error)
      alert('خطأ في اختبار التصدير: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'))
    } finally {
      setIsExporting(false)
    }
  }

  // دالة إنشاء محتوى HTML للـ PDF
  const createPDFContent = () => {
      const currentDate = new Date()
      const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic')
      const time = currentDate.toLocaleTimeString('ar-SA', { hour12: true })
      
    // Calculate all nutrition plans
    const bmr = 10 * playerData.weight + 6.25 * playerData.height - 5 * playerData.age + 5
    
    const activityMultipliers = {
      'كسول (بدون تمرين)': 1.2,
      'نشاط خفيف (1-2 يوم تمرين اسبوعيا)': 1.375,
      'نشاط متوسط (3-4 أيام تمرين اسبوعيا)': 1.55,
      'نشاط عالي (5-6 أيام تمرين اسبوعيا)': 1.725,
      'نشاط مكثف (تمرين يومي + نشاط بدني)': 1.9
    }
    
    const positionMultipliers = {
      'حارس مرمى': 1.1,
      'مدافع': 1.15,
      'محور': 1.2,
      'جناح': 1.25,
      'مهاجم': 1.3
    }
    
    const tdee = bmr * (activityMultipliers[playerData.activityLevel as keyof typeof activityMultipliers] || 1.55) * (positionMultipliers[playerData.position as keyof typeof positionMultipliers] || 1.2)
    
    // Calculate nutrition plans
    const maintenancePlan = {
      calories: Math.round(tdee),
      protein: Math.round(tdee * 0.25 / 4),
      carbs: Math.round(tdee * 0.55 / 4),
      fat: Math.round(tdee * 0.2 / 9),
      water: Math.round(playerData.weight * 0.033)
    }
    
    const weightGainPlan = {
      calories: Math.round(tdee + 500),
      protein: Math.round((tdee + 500) * 0.25 / 4),
      carbs: Math.round((tdee + 500) * 0.55 / 4),
      fat: Math.round((tdee + 500) * 0.2 / 9),
      water: Math.round(playerData.weight * 0.033)
    }
    
    const weightLossPlan = {
      calories: Math.round(tdee - 500),
      protein: Math.round((tdee - 500) * 0.3 / 4),
      carbs: Math.round((tdee - 500) * 0.45 / 4),
      fat: Math.round((tdee - 500) * 0.25 / 9),
      water: Math.round(playerData.weight * 0.04)
    }
    
    const idealWeight = calculateIdealWeight(playerData.height, playerData.position)
    const weightDifference = playerData.weight - idealWeight.max
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير غذائي احترافي</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          /* قواعد إضافية لمنع انقسام العناصر */
          .page-content > * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .section > * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* منع انقسام الجداول والبطاقات */
          table, tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* منع انقسام العناصر المرنة */
          .flex-container {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          body {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            background: white;
            color: #333;
            line-height: 1.6;
          }
          
          .page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: white;
            position: relative;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .page-header {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 0 0 15px 15px;
            text-align: center;
            height: 60px;
            position: relative;
          }
          
          .page-header h1 {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
          }
          
          .page-header h2 {
            font-size: 11px;
            font-weight: 400;
            margin: 5px 0 0 0;
            opacity: 0.9;
          }
          
          .date-time {
            position: absolute;
            top: 8px;
            right: 15px;
            background: rgba(255,255,255,0.2);
            padding: 4px 6px;
            border-radius: 5px;
            font-size: 10px;
          }
          
          .page-content {
            padding: 0px;
            min-height: calc(297mm - 120px);
            display: flex;
            flex-direction: column;
            gap: 0px;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .section {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 0px;
            margin-bottom: 10px;
            border: 1px solid #e9ecef;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: auto;
            page-break-after: auto;
          }
          
          .section h3 {
            color: #1a472a;
            font-size: 8px;
            font-weight: 600;
            margin-bottom: 0px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
            border-radius: 8px 8px 0 0;
            padding-bottom: 0px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0px;
            padding: 8px;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: auto;
            page-break-after: auto;
          }
          
          .info-item {
            background: white;
            padding: 0px 0px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e9ecef;
            min-height: 25px;
            max-height: 45px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: auto;
            page-break-after: auto;
          }
          
          .info-item h4 {
            font-size: 3px;
            color: #6c757d;
            margin-bottom: 0px;
            font-weight: 600;
          }
          
          .info-item .value {
            font-size: 5px;
            color: #1a472a;
            font-weight: 700;
            margin-top: 2px;
          }
          
          .plan-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0px;
            padding: 8px;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: auto;
            page-break-after: auto;
          }
          
          .plan-card {
            background: white;
            padding: 1px 0px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e9ecef;
            min-height: 90px;
            max-height: 130px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: auto;
            page-break-after: auto;
          }
          
          .plan-card h4 {
            font-size: 5px;
            color: #1a472a;
            margin-bottom: 0px;
            font-weight: 700;
            padding-bottom: 0px;
          }
          
          .plan-card .value {
            font-size: 4px;
            color: #6c757d;
            margin: 1px 0;
          }
          
          .tips-list {
            list-style: none;
            padding: 8px;
            gap: 0px;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: auto;
            page-break-after: auto;
          }
          
          .tips-list li {
            background: white;
            padding: 0px 1px;
            margin-bottom: 5px;
            border-radius: 8px;
            border-right: 4px solid #22c55e;
            font-size: 3px;
            line-height: 1.1;
            min-height: 10px;
            max-height: 30px;
            display: flex;
            align-items: center;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: auto;
            page-break-after: auto;
          }
          
          .tips-list li:before {
            content: "✓";
            color: #22c55e;
            font-weight: bold;
            margin-left: 0px;
            font-size: 3px;
            position: absolute;
            right: 1px;
          }
          
          .footer {
            background: #f8f9fa;
            padding: 6px 15px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            font-size: 9px;
            color: #6c757d;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
          }
          
          .page-number {
            font-weight: 600;
            font-size: 10px;
          }
          
          .system-name {
            font-size: 9px;
            opacity: 0.8;
          }
          
          .missing-data {
            color: #dc3545;
            font-style: italic;
            font-size: 3px;
          }
        </style>
      </head>
      <body>
        <!-- الصفحة الأولى: الغلاف -->
        <div class="page">
          <div class="page-header">
            <h1>تقرير غذائي احترافي</h1>
            <h2>حاسبة لاعب كرة القدم - موسبري</h2>
            <div class="date-time">${hijriDate} - ${time}</div>
          </div>
          <div class="page-content">
            <div class="section">
              <h3>معلومات اللاعب</h3>
              <div class="info-grid">
                <div class="info-item">
                  <h4>الاسم</h4>
                  <div class="value">${playerData.name || '<span class="missing-data">لم يتم إدخال الاسم</span>'}</div>
                </div>
                <div class="info-item">
                  <h4>العمر</h4>
                  <div class="value">${playerData.age || '<span class="missing-data">لم يتم إدخال العمر</span>'} سنة</div>
                </div>
                <div class="info-item">
                  <h4>الطول</h4>
                  <div class="value">${playerData.height || '<span class="missing-data">لم يتم إدخال الطول</span>'} سم</div>
                </div>
                <div class="info-item">
                  <h4>الوزن الحالي</h4>
                  <div class="value">${playerData.weight || '<span class="missing-data">لم يتم إدخال الوزن</span>'} كجم</div>
                </div>
                <div class="info-item">
                  <h4>المركز</h4>
                  <div class="value">${playerData.position || '<span class="missing-data">لم يتم اختيار المركز</span>'}</div>
                </div>
                <div class="info-item">
                  <h4>مستوى النشاط</h4>
                  <div class="value">${playerData.activityLevel || '<span class="missing-data">لم يتم اختيار النشاط</span>'}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            <span class="page-number">صفحة 1</span> | <span class="system-name">نظام موسبري للتغذية الرياضية</span>
          </div>
        </div>
        
        <!-- الصفحة الثانية: النتائج الأساسية -->
        <div class="page">
          <div class="page-header">
            <h1>النتائج الأساسية</h1>
            <h2>احتياجات اللاعب الغذائية اليومية</h2>
            <div class="date-time">${hijriDate} - ${time}</div>
          </div>
          <div class="page-content">
            <div class="section">
              <h3>الاحتياجات اليومية</h3>
              <div class="info-grid">
                <div class="info-item">
                  <h4>السعرات الحرارية</h4>
                  <div class="value">${maintenancePlan.calories} سعرة</div>
                </div>
                <div class="info-item">
                  <h4>البروتين</h4>
                  <div class="value">${maintenancePlan.protein} جرام</div>
                </div>
                <div class="info-item">
                  <h4>الكربوهيدرات</h4>
                  <div class="value">${maintenancePlan.carbs} جرام</div>
                </div>
                <div class="info-item">
                  <h4>الدهون</h4>
                  <div class="value">${maintenancePlan.fat} جرام</div>
                </div>
                <div class="info-item">
                  <h4>الماء</h4>
                  <div class="value">${maintenancePlan.water} لتر</div>
                </div>
                <div class="info-item">
                  <h4>الوزن المثالي</h4>
                  <div class="value">${idealWeight.min}-${idealWeight.max} كجم</div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            <span class="page-number">صفحة 2</span> | <span class="system-name">نظام موسبري للتغذية الرياضية</span>
          </div>
        </div>
        
        <!-- الصفحة الثالثة: تحليل الوزن والتغذية -->
        <div class="page">
          <div class="page-header">
            <h1>تحليل الوزن والتغذية</h1>
            <h2>مقارنة الوزن الحالي مع المثالي</h2>
            <div class="date-time">${hijriDate} - ${time}</div>
          </div>
          <div class="page-content">
            <div class="section">
              <h3>تحليل الوزن</h3>
              <div class="info-grid">
                <div class="info-item">
                  <h4>الوزن الحالي</h4>
                  <div class="value">${playerData.weight || '<span class="missing-data">لم يتم إدخال الوزن</span>'} كجم</div>
                </div>
                <div class="info-item">
                  <h4>الوزن المثالي</h4>
                  <div class="value">${idealWeight.min}-${idealWeight.max} كجم</div>
                </div>
                <div class="info-item">
                  <h4>الفرق المطلوب</h4>
                  <div class="value">${weightDifference > 0 ? '+' : ''}${weightDifference} كجم</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>تفاصيل الاحتياج الغذائي</h3>
              <div class="info-grid">
                <div class="info-item">
                  <h4>معدل الأيض الأساسي</h4>
                  <div class="value">${Math.round(bmr)} سعرة</div>
                </div>
                <div class="info-item">
                  <h4>إجمالي السعرات اليومية</h4>
                  <div class="value">${Math.round(tdee)} سعرة</div>
                </div>
                <div class="info-item">
                  <h4>نسبة البروتين</h4>
                  <div class="value">25%</div>
                </div>
                <div class="info-item">
                  <h4>نسبة الكربوهيدرات</h4>
                  <div class="value">55%</div>
                </div>
                <div class="info-item">
                  <h4>نسبة الدهون</h4>
                  <div class="value">20%</div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            <span class="page-number">صفحة 3</span> | <span class="system-name">نظام موسبري للتغذية الرياضية</span>
          </div>
        </div>
        
        <!-- الصفحة الرابعة: الخطط الغذائية -->
        <div class="page">
          <div class="page-header">
            <h1>الخطط الغذائية الثلاث</h1>
            <h2>خطط مخصصة لتحقيق أهداف مختلفة</h2>
            <div class="date-time">${hijriDate} - ${time}</div>
          </div>
          <div class="page-content">
            <div class="section">
              <h3>الخطط المتاحة</h3>
              <div class="plan-grid">
                <div class="plan-card" style="border-left: 4px solid #22c55e;">
                  <h4>خطة المحافظة</h4>
                  <div class="value">السعرات: ${maintenancePlan.calories}</div>
                  <div class="value">البروتين: ${maintenancePlan.protein}g</div>
                  <div class="value">الكربوهيدرات: ${maintenancePlan.carbs}g</div>
                  <div class="value">الدهون: ${maintenancePlan.fat}g</div>
                  <div class="value">الماء: ${maintenancePlan.water}L</div>
                </div>
                <div class="plan-card" style="border-left: 4px solid #3b82f6;">
                  <h4>خطة زيادة الوزن</h4>
                  <div class="value">السعرات: ${weightGainPlan.calories}</div>
                  <div class="value">البروتين: ${weightGainPlan.protein}g</div>
                  <div class="value">الكربوهيدرات: ${weightGainPlan.carbs}g</div>
                  <div class="value">الدهون: ${weightGainPlan.fat}g</div>
                  <div class="value">الماء: ${weightGainPlan.water}L</div>
                </div>
                <div class="plan-card" style="border-left: 4px solid #ef4444;">
                  <h4>خطة خسارة الوزن</h4>
                  <div class="value">السعرات: ${weightLossPlan.calories}</div>
                  <div class="value">البروتين: ${weightLossPlan.protein}g</div>
                  <div class="value">الكربوهيدرات: ${weightLossPlan.carbs}g</div>
                  <div class="value">الدهون: ${weightLossPlan.fat}g</div>
                  <div class="value">الماء: ${weightLossPlan.water}L</div>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            <span class="page-number">صفحة 4</span> | <span class="system-name">نظام موسبري للتغذية الرياضية</span>
          </div>
        </div>
        
        <!-- الصفحة الخامسة: نصائح الأداء -->
        <div class="page">
          <div class="page-header">
            <h1>أساسيات الأداء</h1>
            <h2>نصائح عملية لتحسين الأداء الرياضي</h2>
            <div class="date-time">${hijriDate} - ${time}</div>
          </div>
          <div class="page-content">
            <div class="section">
              <h3>نصائح عامة</h3>
              <ul class="tips-list">
                <li>اشرب ${maintenancePlan.water} لتر من الماء يومياً للحفاظ على الترطيب الأمثل</li>
                <li>تناول وجبات صغيرة كل 3-4 ساعات للحفاظ على مستويات الطاقة</li>
                <li>احرص على المرونة في النظام الغذائي مع الحفاظ على الأهداف الأساسية</li>
                <li>حافظ على نسبة دهون جسم منخفضة (8-12% للرياضيين)</li>
                <li>استشر أخصائي تغذية رياضي للحصول على خطة مخصصة</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <span class="page-number">صفحة 5</span> | <span class="system-name">نظام موسبري للتغذية الرياضية</span>
          </div>
        </div>
        
        <!-- الصفحة السادسة: النوم والتعافي -->
        <div class="page">
          <div class="page-header">
            <h1>النوم والتعافي</h1>
            <h2>أساسيات النوم والتعافي للرياضيين</h2>
            <div class="date-time">${hijriDate} - ${time}</div>
          </div>
          <div class="page-content">
            <div class="section">
              <h3>ساعات النوم الموصى بها</h3>
              <div class="info-grid">
                <div class="info-item">
                  <h4>الرياضيون النشطون</h4>
                  <div class="value">7-9 ساعات</div>
                </div>
                <div class="info-item">
                  <h4>أيام التدريب المكثف</h4>
                  <div class="value">8-10 ساعات</div>
                </div>
                <div class="info-item">
                  <h4>أيام المنافسة</h4>
                  <div class="value">9-11 ساعة</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>نصائح للتعافي</h3>
              <ul class="tips-list">
                <li>خذ قيلولة قصيرة (20-30 دقيقة) بعد التدريب المكثف</li>
                <li>في الأيام الحارة، زد استهلاك الماء بنسبة 20%</li>
                <li>مارس التعافي النشط مثل المشي الخفيف أو السباحة</li>
                <li>احرص على راحة كافية بين التدريبات المكثفة</li>
                <li>استخدم تقنيات الاسترخاء مثل التأمل أو التنفس العميق</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <span class="page-number">صفحة 6</span> | <span class="system-name">نظام موسبري للتغذية الرياضية</span>
          </div>
        </div>
      </body>
      </html>
    `
  }







  // دالة التصدير باستخدام الطباعة المباشرة
  const exportToPrintPage = async () => {
    setIsExporting(true)
    try {
      // تجهيز بيانات التقرير
      const reportData = {
        name: playerData.name,
        age: playerData.age,
        height: playerData.height,
        currentWeight: playerData.weight,
        position: playerData.position,
        activityLevel: playerData.activityLevel,
        country: 'السعودية', // يمكن إضافته لاحقاً
        calories: nutritionPlan.calories,
        protein: nutritionPlan.protein,
        carbs: nutritionPlan.carbs,
        fat: nutritionPlan.fat,
        water: nutritionPlan.water,
        idealWeight: nutritionPlan.idealWeight.min,
        weightGain: {
          calories: Math.round(nutritionPlan.calories * 1.1),
          protein: Math.round(nutritionPlan.protein * 1.1),
          carbs: Math.round(nutritionPlan.carbs * 1.1),
          fat: Math.round(nutritionPlan.fat * 1.1)
        },
        maintenance: {
          calories: nutritionPlan.calories,
          protein: nutritionPlan.protein,
          carbs: nutritionPlan.carbs,
          fat: nutritionPlan.fat
        },
        weightLoss: {
          calories: Math.round(nutritionPlan.calories * 0.9),
          protein: Math.round(nutritionPlan.protein * 1.1),
          carbs: Math.round(nutritionPlan.carbs * 0.8),
          fat: Math.round(nutritionPlan.fat * 0.9)
        }
      }

      // تشفير البيانات وإرسالها إلى صفحة الطباعة
      const encodedData = encodeURIComponent(JSON.stringify(reportData))
      const printPageUrl = `/print-report?data=${encodedData}`
      
      // فتح صفحة الطباعة في نافذة جديدة
      window.open(printPageUrl, '_blank')
      
      setIsExporting(false)
    } catch (error) {
      console.error('خطأ في فتح صفحة التقرير:', error)
      setIsExporting(false)
      alert('حدث خطأ أثناء فتح صفحة التقرير. يرجى المحاولة مرة أخرى.')
    }
  }

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a472a 0%, #0f2e1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#374151', fontSize: '18px', margin: 0 }}>جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // Chart data
  const pieChartData = {
    labels: ['بروتين', 'كربوهيدرات', 'دهون'],
    datasets: [{
      data: [nutritionPlan.protein * 4, nutritionPlan.carbs * 4, nutritionPlan.fat * 9],
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }

  const barChartData = {
    labels: ['السعرات الحرارية', 'البروتين', 'الكربوهيدرات', 'الدهون'],
    datasets: [{
      label: 'القيم اليومية',
      data: [nutritionPlan.calories / 20, nutritionPlan.protein, nutritionPlan.carbs, nutritionPlan.fat],
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
      borderWidth: 1,
      borderColor: '#ffffff'
    }]
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a472a 0%, #0f2e1a 100%)',
      padding: '10px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#1a472a',
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          حاسبة التغذية الرياضية
        </h1>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div style={{
            background: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#dc2626', marginBottom: '10px', fontSize: '1.1rem' }}>أخطاء في الإدخال:</h3>
            <ul style={{ color: '#dc2626', margin: 0, paddingLeft: '20px' }}>
              {validationErrors.map((error, index) => (
                <li key={index} style={{ marginBottom: '5px' }}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Input Form */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>الاسم:</label>
            <input
              type="text"
              value={playerData.name}
              onChange={(e) => setPlayerData({...playerData, name: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="أدخل اسم اللاعب"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>العمر:</label>
            <input
              type="number"
              value={playerData.age}
              onChange={(e) => setPlayerData({...playerData, age: parseInt(e.target.value) || 0})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              min="9"
              max="65"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>الوزن (كجم):</label>
            <input
              type="number"
              value={playerData.weight}
              onChange={(e) => setPlayerData({...playerData, weight: parseFloat(e.target.value) || 0})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              min="20"
              max="200"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>الطول (سم):</label>
            <input
              type="number"
              value={playerData.height}
              onChange={(e) => setPlayerData({...playerData, height: parseFloat(e.target.value) || 0})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              min="100"
              max="250"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>المركز:</label>
            <select
              value={playerData.position}
              onChange={(e) => setPlayerData({...playerData, position: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            >
              <option value="حارس مرمى">حارس مرمى</option>
              <option value="مدافع">مدافع</option>
              <option value="محور">محور</option>
              <option value="مهاجم">مهاجم</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>مستوى النشاط:</label>
            <select
              value={playerData.activityLevel}
              onChange={(e) => setPlayerData({...playerData, activityLevel: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            >
              <option value="كسول (بدون تمرين)">كسول (بدون تمرين)</option>
              <option value="نشاط خفيف (1-2 يوم تمرين اسبوعيا)">نشاط خفيف (1-2 يوم تمرين اسبوعيا)</option>
              <option value="نشاط متوسط (3-4 أيام تمرين اسبوعيا)">نشاط متوسط (3-4 أيام تمرين اسبوعيا)</option>
              <option value="نشاط عالي (5-6 أيام تمرين اسبوعيا)">نشاط عالي (5-6 أيام تمرين اسبوعيا)</option>
              <option value="نشاط مكثف (تمرين يومي + نشاط بدني)">نشاط مكثف (تمرين يومي + نشاط بدني)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>الخطة:</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as 'maintain' | 'gain' | 'lose')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            >
              <option value="maintain">المحافظة على الوزن</option>
              <option value="gain">زيادة الوزن</option>
              <option value="lose">خسارة الوزن</option>
            </select>
          </div>
        </div>

        {/* Calculate Button */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            style={{
              background: isCalculating ? '#9ca3af' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: 'white',
              padding: '15px 30px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: isCalculating ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              minWidth: '200px'
            }}
          >
            {isCalculating ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  display: 'inline-block',
                  marginRight: '10px'
                }}></div>
                جاري الحساب...
              </>
            ) : 'احسب الخطة الغذائية'}
          </button>
        </div>

        {/* Results */}
        {showResults && (
          <div id="results" style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px',
            border: '2px solid #0ea5e9'
          }}>
            <h2 style={{
              color: '#0c4a6e',
              fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              النتائج
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px'
            }}>
              <div style={{
                background: 'white',
                padding: '15px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#22c55e', marginBottom: '10px', fontSize: '0.9rem' }}>السعرات الحرارية</h3>
                <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 'bold', color: '#1a472a', margin: 0 }}>
                  {nutritionPlan.calories} سعرة
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '15px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#3b82f6', marginBottom: '10px', fontSize: '0.9rem' }}>البروتين</h3>
                <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 'bold', color: '#1a472a', margin: 0 }}>
                  {nutritionPlan.protein} جرام
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '15px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#f59e0b', marginBottom: '10px', fontSize: '0.9rem' }}>الكربوهيدرات</h3>
                <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 'bold', color: '#1a472a', margin: 0 }}>
                  {nutritionPlan.carbs} جرام
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '15px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#ef4444', marginBottom: '10px', fontSize: '0.9rem' }}>الدهون</h3>
                <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 'bold', color: '#1a472a', margin: 0 }}>
                  {nutritionPlan.fat} جرام
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '15px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#06b6d4', marginBottom: '10px', fontSize: '0.9rem' }}>الماء</h3>
                <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 'bold', color: '#1a472a', margin: 0 }}>
                  {nutritionPlan.water} لتر
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '15px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#8b5cf6', marginBottom: '10px', fontSize: '0.9rem' }}>الوزن المثالي</h3>
                <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 'bold', color: '#1a472a', margin: 0 }}>
                  {nutritionPlan.idealWeight.min}-{nutritionPlan.idealWeight.max} كجم
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {showResults && chartsReady && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'white',
              padding: '15px',
              borderRadius: '15px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#1a472a', fontSize: '1.1rem' }}>
                توزيع المغذيات
              </h3>
              <div style={{ height: '250px' }}>
                {Pie && <Pie data={pieChartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        font: {
                          size: 12
                        }
                      }
                    }
                  }
                }} />}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '15px',
              borderRadius: '15px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#1a472a', fontSize: '1.1rem' }}>
                القيم اليومية
              </h3>
              <div style={{ height: '250px' }}>
                {Bar && <Bar data={barChartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} />}
              </div>
            </div>
          </div>
        )}

        {/* Export Buttons */}
        {showResults && (
          <div style={{ textAlign: 'center', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={testExport}
              disabled={isExporting}
              style={{
                background: isExporting ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                minWidth: '150px'
              }}
            >
              {isExporting ? 'جاري الاختبار...' : 'اختبار التصدير'}
            </button>
            
            <button
              onClick={exportToPrintPage}
              disabled={isExporting}
              style={{
                background: isExporting ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                minWidth: '200px'
              }}
            >
              {isExporting ? 'جاري التصدير...' : 'تقرير احترافي (طباعة)'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}), { ssr: false })

export default Calculator 