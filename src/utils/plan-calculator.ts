export type Gender = 'male' | 'female';

export type ActivityLevel = 
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'high'
  | 'very_high';

export type Goal = 'maintain' | 'cut' | 'bulk';

export type Position = 'GK' | 'CB' | 'FB/WB' | 'DM/CM/AM' | 'ST/CF-fast' | 'Winger';

export interface PlanInput {
  name: string;
  age_years: number;
  sex: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel; // used outside this unit for maintenance calories
  position: Position;
  goal: Goal;
  calories_maint: number;
}

export interface PlanOutput {
  calories: {
    maintain: number;
    final_min: number;
    final_max: number;
    delta_min: number;
    delta_max: number;
  };
  protein_g: { min: number; max: number };
  fat_g: { min: number; max: number };
  carb_g: { min: number; max: number };
  ideal_weight_kg: { min: number; max: number };
  ui: {
    delta_badge_min: { text: string | null; color: 'green' | 'red' | null };
    delta_badge_max: { text: string | null; color: 'green' | 'red' | null };
  };
  notes: string;
  checks: {
    kcal_from_min_combo: number;
    kcal_from_max_combo: number;
    calories_target_min: number;
    calories_target_max: number;
  };
}

// ثوابت الطاقة
const CALORIES_PER_GRAM = {
  PROTEIN: 4,    // 4 ك.س/غ
  CARBS: 4,      // 4 ك.س/غ
  FAT: 9         // 9 ك.س/غ
} as const;

// نسب البروتين حسب الفئة العمرية والهدف (غ/كغ)
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

// نسب الدهون (من إجمالي السعرات النهائية)
const FAT_RATIOS = {
  min: 0.25,  // 25%
  max: 0.35   // 35%
} as const;

// إزاحات الوزن المثالي حسب المركز
const POSITION_OFFSETS = {
  'GK': { min: -5, max: 2 },
  'CB': { min: -5, max: 2 },
  'FB/WB': { min: -6, max: 0 },
  'DM/CM/AM': { min: -5, max: 0 },
  'ST/CF-fast': { min: -5, max: 3 },
  'Winger': { min: -7, max: 0 }
} as const;

/**
 * تحديد الفئة العمرية - مع الحد الفاصل الصحيح
 */
function getAgeGroup(age: number): keyof typeof PROTEIN_RATIOS {
  if (age >= 9 && age <= 12) return '9-12';
  if (age >= 13 && age <= 17) return '13-18'; // 13–17 فقط
  if (age >= 18) return '18+'; // 18+ يبدأ من 18
  throw new Error('هذه الحاسبة تدعم أعمار 9 سنوات فأكثر.');
}

/**
 * حساب الوزن المثالي حسب المركز والطول
 */
function computeIdealWeight(position: Position, height_cm: number): { min: number; max: number } {
  if (height_cm < 140 || height_cm > 210) {
    throw new Error('الطول يجب أن يكون بين 140 و 210 سم');
  }
  
  const base = height_cm - 100;
  const offsets = POSITION_OFFSETS[position];
  
  const min = Math.round(base + offsets.min);
  const max = Math.round(base + offsets.max);
  
  return { min, max };
}

/**
 * حساب خطة التغذية الشاملة
 */
export function computePlan(input: PlanInput): PlanOutput {
  const { name, age_years, sex, height_cm, weight_kg, activity_level, position, goal, calories_maint } = input;
  
  // التحقق من القيم
  if (age_years < 9) {
    throw new Error('هذه الحاسبة تدعم أعمار 9 سنوات فأكثر.');
  }
  
  if (height_cm < 140 || height_cm > 210) {
    throw new Error('الطول يجب أن يكون بين 140 و 210 سم');
  }
  
  if (weight_kg < 30 || weight_kg > 140) {
    throw new Error('الوزن يجب أن يكون بين 30 و 140 كجم');
  }
  
  if (calories_maint < 800) {
    throw new Error('السعرات يجب أن تكون 800 سعرة على الأقل');
  }
  
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
  
  // حساب الوزن المثالي
  const idealWeight = computeIdealWeight(position, height_cm);
  
  // إنشاء شارات فرق السعرات
  const deltaBadgeMin = {
    text: goal === 'maintain' ? null : (goal === 'bulk' ? `+${Math.abs(deltaMin)}` : `-${Math.abs(deltaMin)}`),
    color: goal === 'bulk' ? 'green' as const : (goal === 'cut' ? 'red' as const : null)
  };
  
  const deltaBadgeMax = {
    text: goal === 'maintain' ? null : (goal === 'bulk' ? `+${Math.abs(deltaMax)}` : `-${Math.abs(deltaMax)}`),
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
    ideal_weight_kg: idealWeight,
    ui: {
      delta_badge_min: deltaBadgeMin,
      delta_badge_max: deltaBadgeMax
    },
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
export function formatPlanDisplay(plan: PlanOutput): {
  protein: string;
  fat: string;
  carbs: string;
  calories: string;
  ideal_weight: string;
  delta: string;
} {
  const protein = `البروتين: غ ${plan.protein_g.min} – ${plan.protein_g.max}`;
  const fat = `الدهون: غ ${plan.fat_g.min} – ${plan.fat_g.max}`;
  const carbs = `الكربوهيدرات: غ ${plan.carb_g.min} – ${plan.carb_g.max}`;
  
  let calories = `السعرات: ${plan.calories.final_min} – ${plan.calories.final_max} سعرة`;
  if (plan.calories.delta_min !== 0 || plan.calories.delta_max !== 0) {
    calories += ` (${plan.calories.maintain} + ${plan.ui.delta_badge_min.text} إلى ${plan.ui.delta_badge_max.text})`;
  }
  
  const ideal_weight = `الوزن المثالي: من ${plan.ideal_weight_kg.min} إلى ${plan.ideal_weight_kg.max} كجم`;
  
  let delta = '';
  if (plan.ui.delta_badge_min.text && plan.ui.delta_badge_max.text) {
    delta = `التعديل: ${plan.ui.delta_badge_min.text} إلى ${plan.ui.delta_badge_max.text} سعرة`;
  }
  
  return { protein, fat, carbs, calories, ideal_weight, delta };
}

/**
 * حساب القيم المتوسطة (للعرض كقيمة واحدة)
 */
export function getPlanMidpoints(plan: PlanOutput): {
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  ideal_weight: number;
} {
  return {
    protein: Math.round((plan.protein_g.min + plan.protein_g.max) / 2),
    fat: Math.round((plan.fat_g.min + plan.fat_g.max) / 2),
    carbs: Math.round((plan.carb_g.min + plan.carb_g.max) / 2),
    calories: Math.round((plan.calories.final_min + plan.calories.final_max) / 2),
    ideal_weight: Math.round((plan.ideal_weight_kg.min + plan.ideal_weight_kg.max) / 2)
  };
}
