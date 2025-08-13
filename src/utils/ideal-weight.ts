export type Position = 
  | 'GK'           // حارس المرمى
  | 'CB'           // قلب الدفاع
  | 'FB/WB'        // الظهير
  | 'DM/CM/AM'     // المحور (دفاعي أو هجومي)
  | 'ST/CF-fast'   // المهاجم السريع/الوهمي
  | 'Winger';      // الجناح

export interface IdealWeightInput {
  height_cm: number;     // الطول بالسنتمتر
  position: string;      // مركز اللعب
  weight_kg?: number;    // الوزن الحالي اختياري (لأغراض المقارنة)
}

export interface IdealWeightOutput {
  ideal_weight_kg: { min: number; max: number };
  base: number;                    // (height_cm - 100) للشفافية
  position_normalized: Position;
  notes: string;                   // نص عربي قصير للاستخدام في الواجهة
}

// إزاحات الوزن المثالي لكل مركز
const POSITION_OFFSETS: Record<Position, { min: number; max: number }> = {
  'GK': { min: -5, max: 2 },           // حارس المرمى
  'CB': { min: -5, max: 2 },           // قلب الدفاع
  'FB/WB': { min: -6, max: 0 },        // الظهير
  'DM/CM/AM': { min: -5, max: 0 },     // المحور (دفاعي أو هجومي)
  'ST/CF-fast': { min: -5, max: 3 },   // المهاجم السريع/الوهمي
  'Winger': { min: -7, max: 0 }        // الجناح
};

// تحويل أسماء المراكز العربية إلى Enums موحدة
const POSITION_MAPPING: Record<string, Position> = {
  // حارس مرمى
  'حارس مرمى': 'GK',
  'حارس': 'GK',
  'GK': 'GK',
  
  // قلب الدفاع
  'قلب الدفاع': 'CB',
  'مدافع': 'CB',
  'CB': 'CB',
  
  // الظهير
  'ظهير': 'FB/WB',
  'ظهير أيمن': 'FB/WB',
  'ظهير أيسر': 'FB/WB',
  'FB': 'FB/WB',
  'WB': 'FB/WB',
  
  // المحور
  'محور': 'DM/CM/AM',
  'محور دفاعي': 'DM/CM/AM',
  'محور هجومي': 'DM/CM/AM',
  'وسط': 'DM/CM/AM',
  'وسط دفاعي': 'DM/CM/AM',
  'وسط هجومي': 'DM/CM/AM',
  'DM': 'DM/CM/AM',
  'CM': 'DM/CM/AM',
  'AM': 'DM/CM/AM',
  
  // المهاجم
  'مهاجم': 'ST/CF-fast',
  'مهاجم صريح': 'ST/CF-fast',
  'مهاجم وهمي': 'ST/CF-fast',
  'مهاجم سريع': 'ST/CF-fast',
  'ST': 'ST/CF-fast',
  'CF': 'ST/CF-fast',
  
  // الجناح
  'جناح': 'Winger',
  'جناح أيمن': 'Winger',
  'جناح أيسر': 'Winger',
  'Winger': 'Winger'
};

/**
 * حساب الوزن المثالي للاعب كرة القدم
 */
export function computeIdealWeight(input: IdealWeightInput): IdealWeightOutput {
  const { height_cm, position, weight_kg } = input;
  
  // التحقق من صحة الطول
  if (height_cm < 140 || height_cm > 210) {
    throw new Error('الطول يجب أن يكون بين 140 و 210 سم');
  }
  
  // تحويل المركز إلى Enum موحد
  const normalizedPosition = POSITION_MAPPING[position];
  if (!normalizedPosition) {
    const supportedPositions = Object.keys(POSITION_OFFSETS).join(', ');
    throw new Error(`المركز غير مدعوم. المراكز المتاحة: ${supportedPositions}`);
  }
  
  // حساب القاعدة الأساسية
  const base = height_cm - 100;
  
  // تطبيق الإزاحات حسب المركز
  const offsets = POSITION_OFFSETS[normalizedPosition];
  const min = Math.round(base + offsets.min);
  const max = Math.round(base + offsets.max);
  
  // إنشاء الملاحظات
  let notes = `الوزن المثالي: من ${min} إلى ${max} كجم`;
  
  // إضافة مقارنة مع الوزن الحالي إن وجد
  if (weight_kg !== undefined && weight_kg !== null) {
    if (weight_kg < min) {
      const diff = min - weight_kg;
      notes += ` (أقل من الحد الأدنى بـ ${diff} كجم)`;
    } else if (weight_kg > max) {
      const diff = weight_kg - max;
      notes += ` (أعلى من الحد الأقصى بـ ${diff} كجم)`;
    } else {
      notes += ` (ضمن المدى المثالي)`;
    }
  }
  
  return {
    ideal_weight_kg: { min, max },
    base,
    position_normalized: normalizedPosition,
    notes
  };
}

/**
 * تنسيق النص العربي للعرض
 */
export function formatIdealWeightDisplay(output: IdealWeightOutput): {
  weight: string;
  comparison: string;
} {
  const weight = `الوزن المثالي: من ${output.ideal_weight_kg.min} إلى ${output.ideal_weight_kg.max} كجم`;
  
  let comparison = '';
  if (output.notes.includes('أقل من الحد الأدنى')) {
    comparison = '⚠️ أقل من الوزن المثالي';
  } else if (output.notes.includes('أعلى من الحد الأقصى')) {
    comparison = '⚠️ أعلى من الوزن المثالي';
  } else if (output.notes.includes('ضمن المدى المثالي')) {
    comparison = '✅ ضمن الوزن المثالي';
  }
  
  return { weight, comparison };
}

/**
 * الحصول على جميع المراكز المدعومة
 */
export function getSupportedPositions(): string[] {
  return Object.keys(POSITION_MAPPING);
}

/**
 * التحقق من صحة المركز
 */
export function isValidPosition(position: string): boolean {
  return position in POSITION_MAPPING;
}
