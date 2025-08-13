export type Gender = 'ذكر' | 'أنثى';

export type ActivityLevel = 
  | 'كسول (بدون تمرين)'
  | 'نشاط خفيف (1-2 يوم تمرين اسبوعيا)'
  | 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
  | 'نشاط عالي (5-6 أيام تمرين اسبوعيا)'
  | 'نشاط مكثف (تمرين يومي + نشاط بدني)';

// عوامل النشاط (mapping ثابت للنص العربي)
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  'كسول (بدون تمرين)': 1.2,
  'نشاط خفيف (1-2 يوم تمرين اسبوعيا)': 1.376,
  'نشاط متوسط (3-4 أيام تمرين اسبوعيا)': 1.55,
  'نشاط عالي (5-6 أيام تمرين اسبوعيا)': 1.725,
  'نشاط مكثف (تمرين يومي + نشاط بدني)': 1.9,
};

// التحقق من صحة المدخلات
export function validateInputs({
  weightKg,
  heightCm,
  ageYears,
  gender,
  activityLevel
}: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}): { isValid: boolean; error?: string } {
  if (weightKg < 20 || weightKg > 250) {
    return { isValid: false, error: 'الوزن يجب أن يكون بين 20 و 250 كجم' };
  }
  
  if (heightCm < 100 || heightCm > 230) {
    return { isValid: false, error: 'الطول يجب أن يكون بين 100 و 230 سم' };
  }
  
  if (ageYears < 9 || ageYears > 80) {
    return { isValid: false, error: 'العمر يجب أن يكون بين 9 و 80 سنة' };
  }
  
  if (!Object.keys(ACTIVITY_FACTORS).includes(activityLevel)) {
    return { isValid: false, error: 'مستوى النشاط غير صحيح' };
  }
  
  return { isValid: true };
}

// حساب BMR — معدل الحرق الأساسي
export function calculateBMR({
  gender,
  weightKg,
  heightCm,
  ageYears,
}: {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  if (gender === 'ذكر') {
    // BMR_male = 66.47 + (13.75 × الوزن) + (5 × الطول) − (4.7 × العمر)
    return Math.round(66.47 + 13.75 * weightKg + 5 * heightCm - 4.7 * ageYears);
  } else {
    // BMR_female = 655 + (9.6 × الوزن) + (1.85 × الطول) − (4.7 × العمر)
    return Math.round(655 + 9.6 * weightKg + 1.85 * heightCm - 4.7 * ageYears);
  }
}

// حساب TDEE — السعرات الحرارية اليومية حسب النشاط
export function calculateTDEE({
  bmr,
  activityLabel,
}: {
  bmr: number;
  activityLabel: ActivityLevel;
}): number {
  const factor = ACTIVITY_FACTORS[activityLabel];
  if (!factor) {
    throw new Error(`Unknown activity level: ${activityLabel}`);
  }
  return Math.round(bmr * factor);
}

// دالة رئيسية لحساب كل شيء
export function calculateCalories({
  gender,
  weightKg,
  heightCm,
  ageYears,
  activityLevel,
}: {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activityLevel: ActivityLevel;
}): { bmr: number; tdee: number; isValid: boolean; error?: string } {
  // التحقق من صحة المدخلات
  const validation = validateInputs({
    weightKg,
    heightCm,
    ageYears,
    gender,
    activityLevel
  });
  
  if (!validation.isValid) {
    return { bmr: 0, tdee: 0, isValid: false, error: validation.error };
  }
  
  // حساب BMR
  const bmr = calculateBMR({ gender, weightKg, heightCm, ageYears });
  
  // حساب TDEE
  const tdee = calculateTDEE({ bmr, activityLabel: activityLevel });
  
  return { bmr, tdee, isValid: true };
}
