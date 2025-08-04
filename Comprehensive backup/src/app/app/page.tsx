'use client'

import { useState, useEffect } from 'react'
import {
  Sex,
  Position,
  ActivityLevel,
  ActivityLevelLabels,
  getAgeGroup,
  PositionLabels,
} from '@/constants'
import {
  calcIdealWeight,
  calcBMR,
  calcTEE,
  calcProtein,
  calcFat,
  calcCarbs,
} from '@/calculator'

const defaultState = {
  name: '',
  sex: Sex.Male,
  age: 18,
  height: 170,
  weight: 70,
  position: Position.Goalkeeper,
  activity: ActivityLevel.Sedentary,
}

type State = typeof defaultState

const STORAGE_KEY = 'football_calc_inputs'

function saveToStorage(state: State) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
}

function loadFromStorage(): State | null {
  if (typeof window === 'undefined') return null
  
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function validate(state: State) {
  const errors: Partial<Record<keyof State, string>> = {}
  if (!state.name.trim()) errors.name = 'الاسم مطلوب'
  if (state.age < 9 || state.age > 99) errors.age = 'العمر بين 9 و 99 فقط'
  if (state.height < 100 || state.height > 250) errors.height = 'الطول بين 100 و 250 سم'
  if (state.weight < 20 || state.weight > 200) errors.weight = 'الوزن بين 20 و 200 كجم'
  return errors
}

export default function AppPage() {
  const [inputs, setInputs] = useState<State>(defaultState)
  const [errors, setErrors] = useState<Partial<Record<keyof State, string>>>({})
  const [copied, setCopied] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = loadFromStorage()
    if (savedState) {
      setInputs(savedState)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      saveToStorage(inputs)
    }
  }, [inputs, isLoaded])

  useEffect(() => {
    // Fetch user email for watermark
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          setUserEmail(data.email)
        }
      })
      .catch(err => console.error('Failed to fetch user email:', err))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setInputs((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'height' || name === 'weight' ? Number(value) : value,
    }))
  }

  const handleReset = () => {
    setInputs(defaultState)
    setErrors({})
  }

  useEffect(() => {
    setErrors(validate(inputs))
  }, [inputs])

  // Calculations
  const bmr = calcBMR(inputs.sex, inputs.weight, inputs.height, inputs.age)
  const tee = calcTEE(bmr, inputs.activity)
  const idealWeight = calcIdealWeight(inputs.height, inputs.position)
  const protein = calcProtein(inputs.weight, inputs.age)
  const fat = calcFat(tee)
  const carbs = calcCarbs(tee, protein, fat, inputs.age)
  const ageGroup = getAgeGroup(inputs.age)

  const results = [
    { label: 'الوزن المثالي (كجم)', value: `${idealWeight.min} - ${idealWeight.max}` },
    { label: 'السعرات اليومية (كيلو كالوري)', value: tee.toFixed(0) },
    { label: 'البروتين (جم/يوم)', value: `${protein.min} - ${protein.max}` },
    { label: 'الكربوهيدرات (جم/يوم)', value: `${carbs.min} - ${carbs.max}` },
    { label: 'الدهون (جم/يوم)', value: `${fat.min} - ${fat.max}` },
  ]

  const copyResults = () => {
    const text = results.map(r => `${r.label}: ${r.value}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex flex-col items-center justify-center p-4 font-sans relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="w-full max-w-5xl bg-green-800/95 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-white overflow-hidden relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 text-center relative">
          <div className="flex items-center justify-center gap-4">
            <span className="text-4xl">⚽</span>
            <h1 className="text-4xl font-black tracking-wider drop-shadow-lg">حاسبة لاعب كرة القدم - التصميم الجديد</h1>
            <span className="text-4xl">🏟️</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Results Section (Left) */}
          <div className="bg-green-900/60 p-6 border-r-2 border-dashed border-white/30">
            <div className="flex items-center justify-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-white">النتائج</h2>
              <span className="text-3xl">🏆</span>
            </div>
            
            <div className="space-y-4">
              {results.map((r, i) => (
                <div key={i} className="bg-green-800/80 rounded-lg p-3 shadow-inner border border-green-600">
                  <div className="flex justify-between items-center text-white">
                    <span className="font-semibold text-lg">{r.label}</span>
                    <span className="font-bold text-xl text-yellow-300">{r.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Section (Right) */}
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-bold text-white text-lg">الاسم</label>
                <input
                  name="name"
                  value={inputs.name}
                  onChange={handleChange}
                  className={`w-full rounded-lg border-2 px-4 py-3 bg-white text-green-900 font-semibold shadow-inner transition-all duration-200 focus:ring-2 focus:ring-green-400 focus:border-transparent ${errors.name ? 'border-red-400' : 'border-green-300'}`}
                  placeholder="أدخل الاسم"
                  autoComplete="off"
                />
                {errors.name && <div className="text-red-300 text-sm mt-1 font-medium">{errors.name}</div>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-bold text-white">الجنس</label>
                  <select 
                    name="sex" 
                    value={inputs.sex} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border-2 border-green-300 px-4 py-3 bg-white text-green-900 font-semibold shadow-inner transition-all duration-200 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  >
                    <option value={Sex.Male}>ذكر</option>
                    <option value={Sex.Female}>أنثى</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-white">
                    العمر (سنة)
                    <span title="9–12: 9-12، 13–18: 13-18، 18+: +18" className="ml-2 cursor-help text-yellow-300">❓</span>
                  </label>
                  <input
                    name="age"
                    type="number"
                    min={9}
                    max={99}
                    value={inputs.age}
                    onChange={handleChange}
                    className={`w-full rounded-lg border-2 px-4 py-3 bg-white text-green-900 font-semibold shadow-inner transition-all duration-200 focus:ring-2 focus:ring-green-400 focus:border-transparent ${errors.age ? 'border-red-400' : 'border-green-300'}`}
                  />
                  {errors.age && <div className="text-red-300 text-sm mt-1 font-medium">{errors.age}</div>}
                </div>

                <div>
                  <label className="block mb-2 font-bold text-white">الطول (سم)</label>
                  <input
                    name="height"
                    type="number"
                    min={100}
                    max={250}
                    value={inputs.height}
                    onChange={handleChange}
                    className={`w-full rounded-lg border-2 px-4 py-3 bg-white text-green-900 font-semibold shadow-inner transition-all duration-200 focus:ring-2 focus:ring-green-400 focus:border-transparent ${errors.height ? 'border-red-400' : 'border-green-300'}`}
                  />
                  {errors.height && <div className="text-red-300 text-sm mt-1 font-medium">{errors.height}</div>}
                </div>

                <div>
                  <label className="block mb-2 font-bold text-white">الوزن (كجم)</label>
                  <input
                    name="weight"
                    type="number"
                    min={20}
                    max={200}
                    value={inputs.weight}
                    onChange={handleChange}
                    className={`w-full rounded-lg border-2 px-4 py-3 bg-white text-green-900 font-semibold shadow-inner transition-all duration-200 focus:ring-2 focus:ring-green-400 focus:border-transparent ${errors.weight ? 'border-red-400' : 'border-green-300'}`}
                  />
                  {errors.weight && <div className="text-red-300 text-sm mt-1 font-medium">{errors.weight}</div>}
                </div>

                <div>
                  <label className="block mb-2 font-bold text-white">
                    المركز
                    <span title="الوزن المثالي = (الطول - 100) + فرق المركز" className="ml-2 cursor-help text-yellow-300">❓</span>
                  </label>
                  <select 
                    name="position" 
                    value={inputs.position} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border-2 border-green-300 px-4 py-3 bg-white text-green-900 font-semibold shadow-inner transition-all duration-200 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  >
                    {Object.values(Position).map(pos => (
                      <option key={pos} value={pos}>{PositionLabels[pos]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-white">
                    مستوى النشاط
                    <span title="المعامل: 1.2 (بدون تدريب) حتى 1.9 (نشاط مرتفع جدًا)" className="ml-2 cursor-help text-yellow-300">❓</span>
                  </label>
                  <select 
                    name="activity" 
                    value={inputs.activity} 
                    onChange={handleChange} 
                    className="w-full rounded-lg border-2 border-green-300 px-4 py-3 bg-white text-green-900 font-semibold shadow-inner transition-all duration-200 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  >
                    {Object.entries(ActivityLevelLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-green-900 font-bold rounded-lg px-4 py-3 text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-xl">🧹</span>
                  إعادة تعيين
                </button>
                <button
                  type="button"
                  onClick={copyResults}
                  className="flex-1 bg-white hover:bg-green-100 text-green-900 font-bold rounded-lg px-4 py-3 text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 border-2 border-green-600"
                >
                  <span className="text-xl">📋</span>
                  {copied ? 'تم النسخ!' : 'نسخ النتائج'}
                </button>
              </div>

              {/* Disclaimer */}
              <div className="text-center mt-4">
                <p className="text-white/70 text-sm font-medium">
                  جميع الحسابات تقريبية وتعتمد على معادلات علمية مخصصة للاعبي كرة القدم
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Watermark */}
      {userEmail && (
        <div className="fixed bottom-4 right-4 text-white/70 text-sm bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
          👤 {userEmail}
        </div>
      )}
    </div>
  )
} 