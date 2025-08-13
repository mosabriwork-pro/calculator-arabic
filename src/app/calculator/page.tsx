'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

// Dynamically import Chart.js components
const Pie = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Pie })), { ssr: false })
const Bar = dynamic(() => import('react-chartjs-2').then(mod => ({ default: mod.Bar })), { ssr: false })



interface PlayerData {
  name: string
  age: number
  weight: number
  height: number
  gender: 'ذكر' | 'أنثى'
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

// Add new interface for input field values
interface InputFieldValues {
  age: string
  weight: string
  height: string
}

// Add interface for validation hints
interface ValidationHints {
  age: string
  weight: string
  height: string
}

// Disable SSR for the entire calculator component
const Calculator = dynamic(() => Promise.resolve(() => {
  const router = useRouter()
  
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
  
  const [playerData, setPlayerData] = useState<PlayerData>({
    name: '',
    age: 9,
    weight: 30,
    height: 175,
    gender: 'ذكر',
    position: 'محور (دفاعي أو هجومي)',
    activityLevel: 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
  })

  const [isCalculating, setIsCalculating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'maintain' | 'gain' | 'lose'>('maintain')
  const [mounted, setMounted] = useState(false)
  const [chartsReady, setChartsReady] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)

  // Add new state for input field values (strings)
  const [inputValues, setInputValues] = useState<InputFieldValues>({
    age: '9',
    weight: '30',
    height: '175'
  })

  // Add state for validation hints
  const [validationHints, setValidationHints] = useState<ValidationHints>({
    age: '',
    weight: '',
    height: ''
  })

  // Commit function for input validation and clamping
  const commitInput = (field: keyof InputFieldValues, valueString: string, min: number, max: number): string => {
    const trimmed = valueString.trim()
    if (trimmed === '') {
      return ''
    }
    
    const num = Number(valueString)
    if (Number.isNaN(num)) {
      return ''
    }
    
    const clamped = Math.max(min, Math.min(max, Math.floor(num)))
    return String(clamped)
  }

  // Handle input field blur (validation on blur)
  const handleInputBlur = (field: keyof InputFieldValues, min: number, max: number) => {
    const currentValue = inputValues[field]
    const committedValue = commitInput(field, currentValue, min, max)
    
    if (committedValue !== currentValue) {
      setInputValues(prev => ({ ...prev, [field]: committedValue }))
      
      // Update the numeric value in playerData if we have a valid number
      if (committedValue !== '') {
        const numValue = Number(committedValue)
        if (field === 'age') {
          setPlayerData(prev => ({ ...prev, age: numValue }))
        } else if (field === 'weight') {
          setPlayerData(prev => ({ ...prev, weight: numValue }))
        } else if (field === 'height') {
          setPlayerData(prev => ({ ...prev, height: numValue }))
        }
      }
    }
    
    // Clear validation hint
    setValidationHints(prev => ({ ...prev, [field]: '' }))
  }

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
            const age = typeof parsed.age === 'number' && parsed.age >= 9 && parsed.age <= 120 ? parsed.age : 9
            const weight = typeof parsed.weight === 'number' && parsed.weight >= 20 && parsed.weight <= 250 ? parsed.weight : 30
            const height = typeof parsed.height === 'number' && parsed.height >= 140 && parsed.height <= 210 ? parsed.height : 175
            
            setPlayerData(prev => ({
              ...prev,
              name: parsed.name || '',
              age,
              weight,
              height,
              gender: parsed.gender === 'أنثى' ? 'أنثى' : 'ذكر',
              position: parsed.position || 'محور (دفاعي أو هجومي)',
              activityLevel: parsed.activityLevel || 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
            }))
            
            // Initialize input values with the numeric values converted to strings
            setInputValues({
              age: age.toString(),
              weight: weight.toString(),
              height: height.toString()
            })
          }
        } else {
          // No saved data, initialize with default values
          setInputValues({
            age: '9',
            weight: '30',
            height: '175'
          })
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
    const hints: ValidationHints = { age: '', weight: '', height: '' }
    
    if (!playerData.name.trim()) {
      errors.push('يرجى إدخال اسم اللاعب')
    }
    
    // Check age input
    if (inputValues.age === '') {
      hints.age = 'الرجاء إدخال العمر (≥ 9)'
      errors.push('العمر مطلوب')
    } else if (playerData.age < 9 || playerData.age > 120) {
      hints.age = 'العمر يجب أن يكون بين 9 و 120 سنة'
      errors.push('العمر يجب أن يكون بين 9 و 120 سنة')
    }
    
    // Check weight input
    if (inputValues.weight === '') {
      hints.weight = 'الرجاء إدخال الوزن بين 20 و 250 كجم'
      errors.push('الوزن مطلوب')
    } else if (playerData.weight < 20 || playerData.weight > 250) {
      hints.weight = 'الوزن يجب أن يكون بين 20 و 250 كجم'
      errors.push('الوزن يجب أن يكون بين 20 و 250 كجم')
    }
    
    // Check height input
    if (inputValues.height === '') {
      hints.height = 'الرجاء إدخال الطول بين 140 و 210 سم'
      errors.push('الطول مطلوب')
    } else if (playerData.height < 140 || playerData.height > 210) {
      hints.height = 'الطول يجب أن يكون بين 140 و 210 سم'
      errors.push('الطول يجب أن يكون بين 140 و 210 سم')
    }
    
    if (!playerData.gender || (playerData.gender !== 'ذكر' && playerData.gender !== 'أنثى')) {
      errors.push('يرجى اختيار الجنس')
    }
    
    setValidationErrors(errors)
    setValidationHints(hints)
    return errors.length === 0
  }

  // Calculate ideal weight using the correct rules from reference images
  const calculateIdealWeight = (height: number, position: string) => {
    // Base formula: (height_cm - 100)
    const base = height - 100
    
    // Position offsets exactly as specified in reference images
    const positionOffsets = {
      'حارس مرمى': { min: -5, max: 2 },
      'مدافع قلب': { min: -5, max: 2 },
      'مدافع ظهير': { min: -6, max: 0 },
      'محور (دفاعي أو هجومي)': { min: -5, max: 0 },
      'مهاجم صريح/وهمي': { min: -5, max: 3 },
      'مهاجم جناح': { min: -7, max: 0 }
    }
    
    // Get offsets for the selected position
    const offsets = positionOffsets[position as keyof typeof positionOffsets]
    
    if (!offsets) {
      // Default to midfielder if position not recognized
      return { min: Math.round(base - 5), max: Math.round(base + 0) }
    }
    
    // Apply offsets: min = base + offset.min, max = base + offset.max
    const min = Math.round(base + offsets.min)
    const max = Math.round(base + offsets.max)
    
    return { min, max }
  }

  // Calculate nutrition plan using the correct units
  const nutritionPlan = useMemo(() => {
    try {
      // Import the correct calculation functions
      const { calculateBMR, calculateTDEE } = require('../../utils/calories')
      const { computeMacros } = require('../../utils/macros')
    
    // Calculate BMR using the correct formula
    const bmr = calculateBMR({
      gender: playerData.gender,
      weightKg: playerData.weight,
      heightCm: playerData.height,
      ageYears: playerData.age
    })
    
    // Activity multipliers (using the correct values from our utils)
    const activityMultipliers = {
      'كسول (بدون تمرين)': 1.2,
      'نشاط خفيف (1-2 يوم تمرين اسبوعيا)': 1.376,
      'نشاط متوسط (3-4 أيام تمرين اسبوعيا)': 1.55,
      'نشاط عالي (5-6 أيام تمرين اسبوعيا)': 1.725,
      'نشاط مكثف (تمرين يومي + نشاط بدني)': 1.9
    }
    
    // Calculate TDEE (without position multipliers - those are for specific sports)
    const tdee = bmr * activityMultipliers[playerData.activityLevel as keyof typeof activityMultipliers]
    
    // Convert plan names to match macros.ts
    const planMap = {
      'maintain': 'maintain',
      'gain': 'bulk',
      'lose': 'cut'
    } as const
    
    // Use the correct macros calculation
    const macrosResult = computeMacros({
      age_years: playerData.age,
      weight_kg: playerData.weight,
      total_calories: Math.round(tdee),
      goal: planMap[selectedPlan]
    })
    

    
    // Water calculation (4% of body weight)
    const water = Math.round(playerData.weight * 0.04 * 100) / 100
    
    // Ideal weight
    const idealWeight = calculateIdealWeight(playerData.height, playerData.position)
    
    return {
      // السعرات: قيمة واحدة حسب الخطة
      calories: selectedPlan === 'maintain' 
        ? macrosResult.calories.maintain 
        : Math.round((macrosResult.calories.final_min + macrosResult.calories.final_max) / 2),
      protein: macrosResult.protein_g.max,
      carbs: macrosResult.carb_g.max,
      fat: macrosResult.fat_g.max,
      water,
      idealWeight,
      baseCalories: Math.round(tdee),
      caloriesAdjustment: macrosResult.calories.delta_max,
      carbsAdjustment: 0, // Calculated automatically by macros.ts
      // Add detailed macros info with ranges
      macrosDetail: {
        calories: macrosResult.calories,
        protein: macrosResult.protein_g,
        fat: macrosResult.fat_g,
        carbs: macrosResult.carb_g,
        delta_display: macrosResult.delta_display,
        notes: macrosResult.notes,
        carbs_maintain: macrosResult.carb_g,
        carbs_display: macrosResult.carbs_display
      },
      // Add ranges for display
      proteinRange: macrosResult.protein_g,
      fatRange: macrosResult.fat_g,
      carbsRange: macrosResult.carb_g,
      caloriesRange: macrosResult.calories
    }
    } catch (error) {
      console.error('Error calculating nutrition plan:', error)
      // Return default values on error
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        water: 0,
        idealWeight: { min: 0, max: 0 },
        baseCalories: 0,
        caloriesAdjustment: 0,
        carbsAdjustment: 0,
        macrosDetail: {
          calories: { maintain: 0, final_min: 0, final_max: 0, delta_min: 0, delta_max: 0 },
          protein: { min: 0, max: 0 },
          fat: { min: 0, max: 0 },
          carbs: { min: 0, max: 0 },
          delta_display: { text_min: null, text_max: null, color: null },
          carbs_display: {
            base_min: 0,
            base_max: 0,
            base_value: 0,
            delta_g_min: null,
            delta_g_max: null,
            note_text: null,
            note_color: null
          },
          notes: ''
        },
        proteinRange: { min: 0, max: 0 },
        fatRange: { min: 0, max: 0 },
        carbsRange: { min: 0, max: 0 },
        caloriesRange: { maintain: 0, final_min: 0, final_max: 0, delta_min: 0, delta_max: 0 }
      }
    }
  }, [playerData, selectedPlan])

  // Handle calculate button click
  const handleCalculate = () => {
    // Commit all input values before validation
    const committedAge = commitInput('age', inputValues.age, 9, 120)
    const committedWeight = commitInput('weight', inputValues.weight, 20, 250)
    const committedHeight = commitInput('height', inputValues.height, 140, 210)
    
    // Update input values with committed values
    setInputValues({
      age: committedAge,
      weight: committedWeight,
      height: committedHeight
    })
    
    // Update playerData with committed numeric values
    if (committedAge !== '') {
      setPlayerData(prev => ({ ...prev, age: Number(committedAge) }))
    }
    if (committedWeight !== '') {
      setPlayerData(prev => ({ ...prev, weight: Number(committedWeight) }))
    }
    if (committedHeight !== '') {
      setPlayerData(prev => ({ ...prev, height: Number(committedHeight) }))
    }
    
    // Now validate and calculate
    if (validateInputs()) {
      setIsCalculating(true)
      setShowResults(true)
      setIsCalculating(false)
    }
  }

  // Export to PDF


  // دالة إنشاء محتوى HTML للـ PDF
  const createPDFContent = () => {
    try {
      const currentDate = new Date()
      const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic')
      const time = currentDate.toLocaleTimeString('ar-SA', { hour12: true })
      
      // Calculate all nutrition plans using correct formulas
      const { calculateBMR, calculateTDEE } = require('../../utils/calories')
    
    const bmr = calculateBMR({
      gender: playerData.gender,
      weightKg: playerData.weight,
      heightCm: playerData.height,
      ageYears: playerData.age
    })
    
    const activityMultipliers = {
      'كسول (بدون تمرين)': 1.2,
      'نشاط خفيف (1-2 يوم تمرين اسبوعيا)': 1.376,
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
                  <h4>الجنس</h4>
                  <div class="value">${playerData.gender || '<span class="missing-data">لم يتم اختيار الجنس</span>'}</div>
                </div>
                <div class="info-item">
                  <div class="label">المركز</div>
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
    } catch (error) {
      console.error('Error creating PDF content:', error)
      return '<html><body><h1>خطأ في إنشاء التقرير</h1></body></html>'
    }
  }







  // دالة التصدير باستخدام الطباعة المباشرة
  const exportToPrintPage = async () => {
    setIsExporting(true)
    try {
      // تجهيز بيانات التقرير بالشكل الصحيح
      const reportData = {
        name: playerData.name,
        age: playerData.age,
        gender: playerData.gender,
        height: playerData.height,
        currentWeight: playerData.weight,
        position: playerData.position,
        activityLevel: playerData.activityLevel,
        country: 'السعودية',
        goal: selectedPlan,
        // النتائج الأساسية
        calories: nutritionPlan.macrosDetail?.calories || { maintain: 0, final_min: 0, final_max: 0, delta_min: 0, delta_max: 0 },
        protein_g: nutritionPlan.macrosDetail?.protein || { min: 0, max: 0 },
        fat_g: nutritionPlan.macrosDetail?.fat || { min: 0, max: 0 },
        carb_g: nutritionPlan.macrosDetail?.carbs || { min: 0, max: 0 },
        carbs_display: nutritionPlan.macrosDetail?.carbs_display || { base_value: 0, delta_g_min: null, delta_g_max: null, note_text: null, note_color: null },
        water_l: nutritionPlan.water || 0,
        ideal_weight_kg: nutritionPlan.idealWeight || { min: 0, max: 0 },
        notes: nutritionPlan.macrosDetail?.notes || '',
        // الخطط الغذائية
        plans: {
          maintain: {
            cal: nutritionPlan.macrosDetail?.calories?.maintain || 0,
            protein_g: nutritionPlan.macrosDetail?.protein || { min: 0, max: 0 },
            carb_g: nutritionPlan.macrosDetail?.carbs || { min: 0, max: 0 },
            fat_g: nutritionPlan.macrosDetail?.fat || { min: 0, max: 0 }
          },
          bulk: {
            cal: nutritionPlan.macrosDetail?.calories?.final_max || 0,
            protein_g: nutritionPlan.macrosDetail?.protein || { min: 0, max: 0 },
            carb_g: nutritionPlan.macrosDetail?.carbs || { min: 0, max: 0 },
            fat_g: nutritionPlan.macrosDetail?.fat || { min: 0, max: 0 }
          },
          cut: {
            cal: nutritionPlan.macrosDetail?.calories?.final_min || 0,
            protein_g: nutritionPlan.macrosDetail?.protein || { min: 0, max: 0 },
            carb_g: nutritionPlan.macrosDetail?.carbs || { min: 0, max: 0 },
            fat_g: nutritionPlan.macrosDetail?.fat || { min: 0, max: 0 }
          }
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
      data: [(nutritionPlan.protein || 0) * 4, (nutritionPlan.carbs || 0) * 4, (nutritionPlan.fat || 0) * 9],
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }

  const barChartData = {
    labels: ['السعرات الحرارية', 'البروتين', 'الكربوهيدرات', 'الدهون'],
    datasets: [{
      label: 'القيم اليومية',
      data: [(nutritionPlan.calories || 0) / 20, nutritionPlan.protein || 0, nutritionPlan.carbs || 0, nutritionPlan.fat || 0],
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
        {/* Header with Logout Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h1 style={{
            color: '#1a472a',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 'bold',
            margin: 0
          }}>
            حاسبة التغذية الرياضية
          </h1>
          
          <button
            onClick={() => {
              localStorage.removeItem('isLoggedIn')
              localStorage.removeItem('loginTime')
              localStorage.removeItem('userEmail')
              router.push('/login')
            }}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
            onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
          >
            🚪 تسجيل الخروج
          </button>
        </div>

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
              value={inputValues.age}
              onChange={(e) => {
                const value = e.target.value
                setInputValues(prev => ({ ...prev, age: value }))
              }}
              onBlur={() => handleInputBlur('age', 9, 120)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              min="9"
              max="120"
              step="1"
                              placeholder="أدخل عمرك"
              inputMode="numeric"
              dir="ltr"
              lang="ar"
            />
            {validationHints.age && (
              <p style={{ 
                color: '#dc2626', 
                fontSize: '0.8rem', 
                margin: '5px 0 0 0',
                textAlign: 'right'
              }}>
                {validationHints.age}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>الجنس:</label>
            <select
              value={playerData.gender || 'ذكر'}
              onChange={(e) => setPlayerData({...playerData, gender: e.target.value as 'ذكر' | 'أنثى'})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            >
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>الوزن (كجم):</label>
            <input
              type="number"
              value={inputValues.weight}
              onChange={(e) => {
                const value = e.target.value
                setInputValues(prev => ({ ...prev, weight: value }))
              }}
              onBlur={() => handleInputBlur('weight', 20, 250)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              min="20"
              max="250"
              step="1"
                              placeholder="أدخل وزنك بالكيلوغرام"
              inputMode="numeric"
              dir="ltr"
              lang="ar"
            />
            {validationHints.weight && (
              <p style={{ 
                color: '#dc2626', 
                fontSize: '0.8rem', 
                margin: '5px 0 0 0',
                textAlign: 'right'
              }}>
                {validationHints.weight}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>الطول (سم):</label>
            <input
              type="number"
              value={inputValues.height}
              onChange={(e) => {
                const value = e.target.value
                setInputValues(prev => ({ ...prev, height: value }))
              }}
              onBlur={() => handleInputBlur('height', 140, 210)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              min="140"
              max="210"
              step="1"
                              placeholder="أدخل طولك بالسنتيمتر"
              inputMode="numeric"
              dir="ltr"
              lang="ar"
            />
            {validationHints.height && (
              <p style={{ 
                color: '#dc2626', 
                fontSize: '0.8rem', 
                margin: '5px 0 0 0',
                textAlign: 'right'
              }}>
                {validationHints.height}
              </p>
            )}
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
              <option value="مدافع قلب">مدافع قلب</option>
              <option value="مدافع ظهير">مدافع ظهير</option>
              <option value="محور (دفاعي أو هجومي)">محور (دفاعي أو هجومي)</option>
              <option value="مهاجم صريح/وهمي">مهاجم صريح/وهمي</option>
              <option value="مهاجم جناح">مهاجم جناح</option>
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
                  {nutritionPlan.baseCalories || 0} سعرة
                </p>
                {selectedPlan !== 'maintain' && (
                  <p style={{
                    fontSize: '0.8rem',
                    margin: '5px 0 0 0',
                    color: selectedPlan === 'gain' ? '#22c55e' : '#ef4444',
                    fontWeight: 'bold'
                  }}>
                    {selectedPlan === 'gain' ? '+' : '-'}{Math.abs(nutritionPlan.macrosDetail?.delta_display?.text_min || 0)} إلى {Math.abs(nutritionPlan.macrosDetail?.delta_display?.text_max || 0)} من الكربوهيدرات
                  </p>
                )}
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
                  {nutritionPlan.proteinRange?.min || 0}-{nutritionPlan.proteinRange?.max || 0} جرام
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
                  {nutritionPlan.macrosDetail?.carbs_display?.base_min && nutritionPlan.macrosDetail?.carbs_display?.base_max 
                    ? `${nutritionPlan.macrosDetail.carbs_display.base_min}-${nutritionPlan.macrosDetail.carbs_display.base_max} غ`
                    : '0-0 غ'
                  }
                </p>
                {nutritionPlan.macrosDetail?.carbs_display?.note_text && (
                  <p style={{
                    fontSize: '0.8rem',
                    margin: '5px 0 0 0',
                    color: nutritionPlan.macrosDetail.carbs_display.note_color === 'green' ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
                    {nutritionPlan.macrosDetail.carbs_display.note_text}
                  </p>
                )}
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
                  {nutritionPlan.fatRange?.min || 0}-{nutritionPlan.fatRange?.max || 0} جرام
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
                  {nutritionPlan.water || 0} لتر
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
                  {nutritionPlan.idealWeight?.min || 0}-{nutritionPlan.idealWeight?.max || 0} كجم
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Details */}
        {showResults && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '15px',
            marginBottom: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              textAlign: 'center', 
              marginBottom: '20px', 
              color: '#1a472a', 
              fontSize: '1.2rem',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '10px'
            }}>
              تفاصيل الخطة: {selectedPlan === 'maintain' ? 'المحافظة على الوزن' : selectedPlan === 'gain' ? 'زيادة الوزن' : 'خسارة الوزن'}
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              <div style={{
                background: '#f8fafc',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ color: '#22c55e', marginBottom: '10px', fontSize: '1rem' }}>السعرات الأساسية</h4>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1a472a', margin: '5px 0' }}>
                  {nutritionPlan.baseCalories || 0} سعرة
                </p>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '5px 0' }}>
                  السعرات المطلوبة للمحافظة
                </p>
              </div>

              <div style={{
                background: '#f8fafc',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ color: '#3b82f6', marginBottom: '10px', fontSize: '1rem' }}>تعديل السعرات</h4>
                <p style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: (nutritionPlan.caloriesAdjustment || 0) > 0 ? '#22c55e' : (nutritionPlan.caloriesAdjustment || 0) < 0 ? '#ef4444' : '#1a472a',
                  margin: '5px 0'
                }}>
                  {nutritionPlan.caloriesAdjustment > 0 ? '+' : ''}{nutritionPlan.caloriesAdjustment || 0} سعرة
                </p>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '5px 0' }}>
                  {selectedPlan === 'maintain' ? 'لا يوجد تعديل' : selectedPlan === 'gain' ? 'زيادة من الكربوهيدرات' : 'خسارة من الكربوهيدرات'}
                </p>
              </div>

              <div style={{
                background: '#f8fafc',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{ color: '#f59e0b', marginBottom: '10px', fontSize: '1rem' }}>ملاحظات الخطة</h4>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '5px 0', lineHeight: '1.4' }}>
                  {nutritionPlan.macrosDetail?.notes || ''}
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