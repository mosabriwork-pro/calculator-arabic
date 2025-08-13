export type Gender = 'ذكر' | 'أنثى';

export type ActivityLevel = 
  | 'كسول (بدون تمرين)'
  | 'نشاط خفيف (1-2 يوم تمرين اسبوعيا)'
  | 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
  | 'نشاط عالي (5-6 أيام تمرين اسبوعيا)'
  | 'نشاط مكثف (تمرين يومي + نشاط بدني)';

export type Goal = 'maintain' | 'cut' | 'bulk';

export interface MacroInput {
  age_years: number;
  weight_kg: number;
  total_calories: number;
  goal?: Goal; // الخطة: المحافظة، الخسارة، الزيادة
}

export interface MacroRange {
  min: number;
  max: number;
}

export interface MacroOutput {
  calories: {
    maintain: number;
    final_min: number;
    final_max: number;
    delta_min: number;
    delta_max: number;
  };
  protein_g: MacroRange;
  fat_g: MacroRange;
  carb_g: MacroRange;
  delta_display: {
    text_min: string | null;
    text_max: string | null;
    color: 'green' | 'red' | null;
  };
  notes: string;
  checks: {
    kcal_from_min_combo: number;
    kcal_from_max_combo: number;
    calories_target_min: number;
    calories_target_max: number;
  };
}

// ثوابت الطاقة للماكروز
const CALORIES_PER_GRAM = {
  PROTEIN: 4,    // 4 سعرات/غرام
  CARBS: 4,      // 4 سعرات/غرام
  FAT: 9         // 9 سعرات/غرام
} as const;

// نسب البروتين حسب الفئة العمرية والهدف (غرام/كجم)
const PROTEIN_RATIOS = {
  '9-12': {
    maintain: { min: 1.0, max: 1.2 },
    cut: { min: 1.2, max: 1.5 },
    bulk: { min: 1.2, max: 1.5 }
  },
  '13-18': {
    maintain: { min: 1.0, max: 1.4 },
    cut: { min: 1.6, max: 2.0 },
    bulk: { min: 1.6, max: 2.0 }
  },
  '18+': {
    maintain: { min: 1.4, max: 1.6 },
    cut: { min: 2.0, max: 2.0 },
    bulk: { min: 2.0, max: 2.0 }
  }
} as const;

// تعديلات السعرات اليومية حسب العمر والهدف
const CALORIE_DELTAS = {
  '9-12': {
    cut: { min: -200, max: -100 },
    bulk: { min: 200, max: 400 }
  },
  '13-18': {
    cut: { min: -400, max: -200 },
    bulk: { min: 200, max: 400 }
  },
  '18+': {
    cut: { min: -500, max: -300 },
    bulk: { min: 300, max: 500 }
  }
} as const;

// نسب الدهون (من إجمالي السعرات)
const FAT_RATIOS = {
  min: 0.25,  // 25%
  max: 0.35   // 35%
} as const;

/**
 * تحديد الفئة العمرية - إصلاح حدود الفئة
 */
function getAgeGroup(age: number): keyof typeof PROTEIN_RATIOS {
  if (age >= 9 && age <= 12) return '9-12';
  if (age >= 13 && age <= 17) return '13-18'; // 13–17 فقط
  if (age >= 18) return '18+'; // 18+ يبدأ من 18
  throw new Error('هذه الحاسبة تدعم أعمار 9 سنوات فأكثر.');
}

/**
 * حساب الماكروز حسب القواعد المطلوبة مع دعم الخطط المختلفة
 */
export function computeMacros(input: MacroInput): MacroOutput {
  const { age_years, weight_kg, total_calories, goal = 'maintain' } = input;
  
  // التحقق من العمر
  if (age_years < 9) {
    throw new Error('هذه الحاسبة تدعم أعمار 9 سنوات فأكثر.');
  }
  
  // التحقق من الوزن
  if (weight_kg < 20 || weight_kg > 250) {
    throw new Error('الوزن يجب أن يكون بين 20 و 250 كجم');
  }
  
  // التحقق من السعرات
  if (total_calories < 800) {
    throw new Error('السعرات يجب أن تكون 800 سعرة على الأقل');
  }
  
  // تسمية واضحة للسعرات الأساسية
  const calories_maint = total_calories; // alias واضح للاستخدام الداخلي
  
  // تحديد الفئة العمرية
  const ageGroup = getAgeGroup(age_years);
  const proteinRatios = PROTEIN_RATIOS[ageGroup];
  const calorieDeltas = CALORIE_DELTAS[ageGroup];
  
  // حساب السعرات النهائية حسب الخطة
  let finalCaloriesMin = calories_maint;
  let finalCaloriesMax = calories_maint;
  let deltaMin = 0;
  let deltaMax = 0;
  
  if (goal === 'cut') {
    deltaMin = calorieDeltas.cut.min;
    deltaMax = calorieDeltas.cut.max;
    finalCaloriesMin = calories_maint + deltaMin;
    finalCaloriesMax = calories_maint + deltaMax;
  } else if (goal === 'bulk') {
    deltaMin = calorieDeltas.bulk.min;
    deltaMax = calorieDeltas.bulk.max;
    finalCaloriesMin = calories_maint + deltaMin;
    finalCaloriesMax = calories_maint + deltaMax;
  }
  
  // حساب البروتين حسب الهدف - بدون تقريب مبكر
  const proteinRatiosForGoal = proteinRatios[goal];
  const protein_g_min_raw = proteinRatiosForGoal.min * weight_kg;
  const protein_g_max_raw = proteinRatiosForGoal.max * weight_kg;
  
  // حساب الدهون من السعرات النهائية (25-35%) - بدون تقريب مبكر
  // للطرف الأدنى (finalCaloriesMin)
  const fat_min_raw_minCal = (FAT_RATIOS.min * finalCaloriesMin) / CALORIES_PER_GRAM.FAT;
  const fat_max_raw_minCal = (FAT_RATIOS.max * finalCaloriesMin) / CALORIES_PER_GRAM.FAT;
  
  // للطرف الأقصى (finalCaloriesMax)
  const fat_min_raw_maxCal = (FAT_RATIOS.min * finalCaloriesMax) / CALORIES_PER_GRAM.FAT;
  const fat_max_raw_maxCal = (FAT_RATIOS.max * finalCaloriesMax) / CALORIES_PER_GRAM.FAT;
  
  // حساب الكربوهيدرات (المتبقي) - بدون تقريب مبكر
  // للطرف الأدنى (finalCaloriesMin)
  const carb_max_raw_minCal = (finalCaloriesMin - (protein_g_min_raw * CALORIES_PER_GRAM.PROTEIN) - (fat_min_raw_minCal * CALORIES_PER_GRAM.FAT)) / CALORIES_PER_GRAM.CARBS;
  const carb_min_raw_minCal = (finalCaloriesMin - (protein_g_max_raw * CALORIES_PER_GRAM.PROTEIN) - (fat_max_raw_minCal * CALORIES_PER_GRAM.FAT)) / CALORIES_PER_GRAM.CARBS;
  
  // للطرف الأقصى (finalCaloriesMax)
  const carb_max_raw_maxCal = (finalCaloriesMax - (protein_g_min_raw * CALORIES_PER_GRAM.PROTEIN) - (fat_min_raw_maxCal * CALORIES_PER_GRAM.FAT)) / CALORIES_PER_GRAM.CARBS;
  const carb_min_raw_maxCal = (finalCaloriesMax - (protein_g_max_raw * CALORIES_PER_GRAM.PROTEIN) - (fat_max_raw_maxCal * CALORIES_PER_GRAM.FAT)) / CALORIES_PER_GRAM.CARBS;
  
  // التحقق من عدم وجود قيم سالبة للكربوهيدرات - على القيم الخام
  if (carb_min_raw_minCal < 0 || carb_min_raw_maxCal < 0 || carb_max_raw_minCal < 0 || carb_max_raw_maxCal < 0) {
    throw new Error('السعرات غير كافية لتغطية الحد الأدنى من البروتين والدهون.');
  }
  
  // فحوصات الطاقة بالقيم الخام وتسامح صغير (≤1)
  const e_min_combo_minCal = (protein_g_max_raw * CALORIES_PER_GRAM.PROTEIN) + (fat_max_raw_minCal * CALORIES_PER_GRAM.FAT) + (carb_min_raw_minCal * CALORIES_PER_GRAM.CARBS);
  const e_max_combo_maxCal = (protein_g_min_raw * CALORIES_PER_GRAM.PROTEIN) + (fat_min_raw_maxCal * CALORIES_PER_GRAM.FAT) + (carb_max_raw_maxCal * CALORIES_PER_GRAM.CARBS);
  
  if (Math.abs(e_min_combo_minCal - finalCaloriesMin) > 1 || Math.abs(e_max_combo_maxCal - finalCaloriesMax) > 1) {
    console.warn('Energy mismatch > 1 kcal — check rounding or bounds');
  }
  
  // إنشاء عرض فرق السعرات
  const deltaDisplay = {
    text_min: goal === 'maintain' ? null : (goal === 'bulk' ? `+${Math.abs(deltaMin)}` : `-${Math.abs(deltaMin)}`),
    text_max: goal === 'maintain' ? null : (goal === 'bulk' ? `+${Math.abs(deltaMax)}` : `-${Math.abs(deltaMax)}`),
    color: goal === 'bulk' ? 'green' as const : (goal === 'cut' ? 'red' as const : null)
  };
  
  // إنشاء الملاحظات
  const notes = goal === 'maintain'
    ? 'خطة المحافظة على الوزن: السعرات والبروتين ضمن النطاق الطبيعي.'
    : (goal === 'cut'
      ? 'خطة خسارة الوزن: تم تقليل السعرات من الكربوهيدرات مع رفع هدف البروتين حسب الفئة.'
      : 'خطة زيادة الوزن: تم زيادة السعرات من الكربوهيدرات مع رفع هدف البروتين حسب الفئة.');
  
  // الإخراج: قرّب فقط هنا (واحفظ ترتيب النطاقات)
  return {
    calories: {
      maintain: calories_maint,
      final_min: Math.round(finalCaloriesMin),
      final_max: Math.round(finalCaloriesMax),
      delta_min: deltaMin,
      delta_max: deltaMax
    },
    protein_g: { min: Math.round(protein_g_min_raw), max: Math.round(protein_g_max_raw) },
    fat_g: {
      min: Math.round(Math.min(fat_min_raw_minCal, fat_min_raw_maxCal)),
      max: Math.round(Math.max(fat_max_raw_minCal, fat_max_raw_maxCal))
    },
    carb_g: {
      min: Math.round(Math.min(carb_min_raw_minCal, carb_min_raw_maxCal)),
      max: Math.round(Math.max(carb_max_raw_minCal, carb_max_raw_maxCal))
    },
    delta_display: deltaDisplay,
    notes,
    checks: {
      kcal_from_min_combo: Math.round(e_min_combo_minCal),
      kcal_from_max_combo: Math.round(e_max_combo_maxCal),
      calories_target_min: Math.round(finalCaloriesMin),
      calories_target_max: Math.round(finalCaloriesMax)
    }
  };
}

/**
 * تنسيق النص العربي للعرض
 */
export function formatMacroDisplay(macros: MacroOutput): {
  protein: string;
  fat: string;
  carbs: string;
  calories: string;
  delta: string;
} {
  const protein = `البروتين: غ ${macros.protein_g.min} – ${macros.protein_g.max}`;
  const fat = `الدهون: غ ${macros.fat_g.min} – ${macros.fat_g.max}`;
  const carbs = `الكربوهيدرات: غ ${macros.carb_g.min} – ${macros.carb_g.max}`;
  
  let calories = `السعرات: ${macros.calories.final_min} – ${macros.calories.final_max} سعرة`;
  if (macros.calories.delta_min !== 0 || macros.calories.delta_max !== 0) {
    calories += ` (${macros.calories.maintain} + ${macros.delta_display.text_min} إلى ${macros.delta_display.text_max})`;
  }
  
  let delta = '';
  if (macros.delta_display.text_min && macros.delta_display.text_max) {
    delta = `التعديل: ${macros.delta_display.text_min} إلى ${macros.delta_display.text_max} سعرة`;
  }
  
  return { protein, fat, carbs, calories, delta };
}

/**
 * حساب القيم المتوسطة (للعرض كقيمة واحدة)
 */
export function getMacroMidpoints(macros: MacroOutput): {
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
} {
  return {
    protein: Math.round((macros.protein_g.min + macros.protein_g.max) / 2),
    fat: Math.round((macros.fat_g.min + macros.fat_g.max) / 2),
    carbs: Math.round((macros.carb_g.min + macros.carb_g.max) / 2),
    calories: Math.round((macros.calories.final_min + macros.calories.final_max) / 2)
  };
}
