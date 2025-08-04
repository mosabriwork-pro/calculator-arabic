// Football calculator constants and mappings

export enum Sex {
  Male = 'Male',
  Female = 'Female',
}

export enum Position {
  Goalkeeper = 'Goalkeeper',
  CenterBack = 'Center Back',
  FullBack = 'Full Back',
  Midfielder = 'Defensive or Attacking Midfielder',
  Striker = 'Striker or False 9',
  Winger = 'Winger',
}

export const PositionLabels: Record<Position, string> = {
  [Position.Goalkeeper]: 'حارس المرمى',
  [Position.CenterBack]: 'قلب الدفاع',
  [Position.FullBack]: 'ظهير',
  [Position.Midfielder]: 'وسط (دفاعي أو هجومي)',
  [Position.Striker]: 'مهاجم',
  [Position.Winger]: 'جناح',
};

export enum ActivityLevel {
  Sedentary = 1.2,
  Light = 1.376,
  Moderate = 1.55,
  High = 1.725,
  VeryHigh = 1.9,
}

export const ActivityLevelLabels: Record<ActivityLevel, string> = {
  [ActivityLevel.Sedentary]: 'بدون تدريب',
  [ActivityLevel.Light]: 'خفيف / 1–2 أيام بالأسبوع',
  [ActivityLevel.Moderate]: 'متوسط / 3–4 أيام بالأسبوع',
  [ActivityLevel.High]: 'مرتفع / 5–6 أيام بالأسبوع',
  [ActivityLevel.VeryHigh]: 'مرتفع جدًا / 7 أيام بالأسبوع',
};

export type AgeGroup = '9-12' | '13-18' | '+18';

export function getAgeGroup(age: number): AgeGroup {
  if (age >= 9 && age <= 12) return '9-12';
  if (age >= 13 && age <= 18) return '13-18';
  return '+18';
}

export const IdealWeightDiffs: Record<Position, { min: number; max: number }> = {
  [Position.Goalkeeper]: { min: -5, max: 2 },
  [Position.CenterBack]: { min: -5, max: 2 },
  [Position.FullBack]: { min: -5, max: 0 },
  [Position.Midfielder]: { min: -5, max: 0 },
  [Position.Striker]: { min: -5, max: 3 },
  [Position.Winger]: { min: -7, max: 0 },
}; 