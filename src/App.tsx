import React, { useState, useEffect } from 'react';
import {
  Sex,
  Position,
  ActivityLevel,
  ActivityLevelLabels,
  getAgeGroup,
  PositionLabels,
} from './constants';
import {
  calcIdealWeight,
  calcBMR,
  calcTEE,
  calcProtein,
  calcFat,
  calcCarbs,
} from './calculator';

const defaultState = {
  name: '',
  sex: Sex.Male,
  age: 18,
  height: 170,
  weight: 70,
  position: Position.Goalkeeper,
  activity: ActivityLevel.Sedentary,
};

type State = typeof defaultState;

const STORAGE_KEY = 'football_calc_inputs';

function saveToStorage(state: State) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadFromStorage(): State | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function validate(state: State) {
  const errors: Partial<Record<keyof State, string>> = {};
  if (!state.name.trim()) errors.name = 'الاسم مطلوب';
  if (state.age < 9 || state.age > 99) errors.age = 'العمر بين 9 و 99 فقط';
  if (state.height < 100 || state.height > 250) errors.height = 'الطول بين 100 و 250 سم';
  if (state.weight < 20 || state.weight > 200) errors.weight = 'الوزن بين 20 و 200 كجم';
  return errors;
}

function App() {
  const [inputs, setInputs] = useState<State>(() => loadFromStorage() || defaultState);
  const [errors, setErrors] = useState<Partial<Record<keyof State, string>>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    saveToStorage(inputs);
  }, [inputs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'height' || name === 'weight' ? Number(value) : value,
    }));
  };

  const handleReset = () => {
    setInputs(defaultState);
    setErrors({});
  };

  useEffect(() => {
    setErrors(validate(inputs));
  }, [inputs]);

  // Calculations
  const bmr = calcBMR(inputs.sex, inputs.weight, inputs.height, inputs.age);
  const tee = calcTEE(bmr, inputs.activity);
  const idealWeight = calcIdealWeight(inputs.height, inputs.position);
  const protein = calcProtein(inputs.weight, inputs.age);
  const fat = calcFat(tee);
  const carbs = calcCarbs(tee, protein, fat, inputs.age);
  const ageGroup = getAgeGroup(inputs.age);

  const results = [
    { label: 'الوزن المثالي (كجم)', value: `${idealWeight.min} – ${idealWeight.max}` },
    { label: 'السعرات اليومية (كيلو كالوري)', value: tee.toFixed(0) },
    { label: 'البروتين (جم/يوم)', value: `${protein.min} – ${protein.max}` },
    { label: 'الكربوهيدرات (جم/يوم)', value: `${carbs.min} – ${carbs.max}` },
    { label: 'الدهون (جم/يوم)', value: `${fat.min} – ${fat.max}` },
  ];

  const copyResults = () => {
    const text = results.map(r => `${r.label}: ${r.value}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center p-2 font-sans relative z-10">
      <div className="w-full max-w-md bg-green-800/90 border-4 border-white rounded-2xl shadow-2xl p-4 mt-16 relative">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-3xl">🏟️</span>
          <h1 className="text-3xl font-extrabold text-white drop-shadow-lg tracking-wide">حاسبة لاعب كرة القدم</h1>
          <span className="text-3xl">⚽</span>
        </div>
        <form className="grid grid-cols-2 gap-4 mt-12">
          <div className="col-span-2">
            <label className="block mb-1 font-bold text-white">الاسم</label>
            <input
              name="name"
              value={inputs.name}
              onChange={handleChange}
              className={`w-full rounded-lg border px-2 py-1 bg-green-50 text-green-900 font-semibold shadow-inner ${errors.name ? 'border-red-400' : 'border-green-300'}`}
              placeholder="أدخل الاسم"
              autoComplete="off"
            />
            {errors.name && <div className="text-red-200 text-xs mt-1">{errors.name}</div>}
          </div>
          <div>
            <label className="block mb-1 font-bold text-white">الجنس</label>
            <select name="sex" value={inputs.sex} onChange={handleChange} className="w-full rounded-lg border border-green-300 px-2 py-1 bg-green-50 text-green-900 font-semibold">
              <option value={Sex.Male}>ذكر</option>
              <option value={Sex.Female}>أنثى</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-bold text-white">العمر (سنة)
              <span title="9–12: 9-12، 13–18: 13-18، 18+: +18" className="ml-1 cursor-help text-yellow-200">?</span>
            </label>
            <input
              name="age"
              type="number"
              min={9}
              max={99}
              value={inputs.age}
              onChange={handleChange}
              className={`w-full rounded-lg border px-2 py-1 bg-green-50 text-green-900 font-semibold shadow-inner ${errors.age ? 'border-red-400' : 'border-green-300'}`}
            />
            {errors.age && <div className="text-red-200 text-xs mt-1">{errors.age}</div>}
          </div>
          <div>
            <label className="block mb-1 font-bold text-white">الطول (سم)</label>
            <input
              name="height"
              type="number"
              min={100}
              max={250}
              value={inputs.height}
              onChange={handleChange}
              className={`w-full rounded-lg border px-2 py-1 bg-green-50 text-green-900 font-semibold shadow-inner ${errors.height ? 'border-red-400' : 'border-green-300'}`}
            />
            {errors.height && <div className="text-red-200 text-xs mt-1">{errors.height}</div>}
          </div>
          <div>
            <label className="block mb-1 font-bold text-white">الوزن (كجم)</label>
            <input
              name="weight"
              type="number"
              min={20}
              max={200}
              value={inputs.weight}
              onChange={handleChange}
              className={`w-full rounded-lg border px-2 py-1 bg-green-50 text-green-900 font-semibold shadow-inner ${errors.weight ? 'border-red-400' : 'border-green-300'}`}
            />
            {errors.weight && <div className="text-red-200 text-xs mt-1">{errors.weight}</div>}
          </div>
          <div>
            <label className="block mb-1 font-bold text-white">المركز</label>
            <select name="position" value={inputs.position} onChange={handleChange} className="w-full rounded-lg border border-green-300 px-2 py-1 bg-green-50 text-green-900 font-semibold">
              {Object.values(Position).map(pos => (
                <option key={pos} value={pos}>{PositionLabels[pos]}</option>
              ))}
            </select>
            <span title="الوزن المثالي = (الطول - 100) + فرق المركز" className="text-yellow-200 cursor-help ml-1">?</span>
          </div>
          <div className="col-span-2">
            <label className="block mb-1 font-bold text-white">مستوى النشاط</label>
            <select name="activity" value={inputs.activity} onChange={handleChange} className="w-full rounded-lg border border-green-300 px-2 py-1 bg-green-50 text-green-900 font-semibold">
              {Object.entries(ActivityLevelLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <span title="المعامل: 1.2 (بدون تدريب) حتى 1.9 (نشاط مرتفع جدًا)" className="text-yellow-200 cursor-help ml-1">?</span>
          </div>
        </form>
        <div className="my-6 border-t-4 border-dashed border-white pt-4 bg-black/60 rounded-xl shadow-inner">
          <h2 className="text-xl font-extrabold text-center text-yellow-300 mb-2 tracking-widest flex items-center justify-center gap-2">
            <span>النتائج</span>
            <span className="text-2xl">🏆</span>
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {results.map((r, i) => (
              <div key={i} className="flex justify-between items-center text-lg text-white font-mono bg-green-900/80 rounded-lg px-3 py-2 shadow">
                <span>{r.label}</span>
                <span>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold rounded-lg px-2 py-2 text-lg shadow flex items-center justify-center gap-1 transition-all duration-150"
          >
            <span role="img" aria-label="reset">🧹</span> إعادة تعيين
          </button>
          <button
            type="button"
            onClick={copyResults}
            className="flex-1 bg-white hover:bg-green-200 text-green-900 font-bold rounded-lg px-2 py-2 text-lg shadow flex items-center justify-center gap-1 transition-all duration-150 border-2 border-green-700"
          >
            <span role="img" aria-label="copy">⚽</span> {copied ? 'تم النسخ!' : 'نسخ النتائج'}
          </button>
        </div>
        <div className="text-xs text-white/70 mt-4 text-center">
          (وَأَوْفُوا بِالْعَهْدِ إِنَّ الْعَهْدَ كَانَ مَسْئُولًا ﴾
        </div>
      </div>
    </div>
  );
}

export default App;
