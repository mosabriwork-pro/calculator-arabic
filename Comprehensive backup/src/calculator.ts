import { Sex, Position, ActivityLevel, AgeGroup, getAgeGroup, IdealWeightDiffs } from './constants';

// Ideal weight calculation
export function calcIdealWeight(heightCm: number, position: Position): { min: number; max: number } {
  const base = heightCm - 100;
  const { min, max } = IdealWeightDiffs[position];
  return {
    min: Math.round(base + min),
    max: Math.round(base + max),
  };
}

// BMR calculation
export function calcBMR(sex: Sex, weight: number, height: number, age: number): number {
  if (sex === Sex.Male) {
    return 66.47 + 13.75 * weight + 5 * height - 4.7 * age;
  } else {
    return 655 + 9.6 * weight + 1.85 * height - 4.7 * age;
  }
}

// TEE calculation
export function calcTEE(bmr: number, activity: ActivityLevel): number {
  return bmr * activity;
}

// Protein calculation
export function calcProtein(weight: number, age: number): { min: number; max: number } {
  const group = getAgeGroup(age);
  let min, max;
  if (group === '+18') {
    min = weight * 1.4;
    max = weight * 1.6;
  } else if (group === '9-12') {
    min = weight * 1.0;
    max = weight * 1.2;
  } else {
    min = weight * 1.0;
    max = weight * 1.4;
  }
  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
  };
}

// Fat calculation
export function calcFat(tee: number): { min: number; max: number } {
  const min = (tee * 0.25) / 9;
  const max = (tee * 0.35) / 9;
  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
  };
}

// Carbohydrates calculation
export function calcCarbs(tee: number, protein: { min: number; max: number }, fat: { min: number; max: number }, age: number): { min: number; max: number } {
  const group = getAgeGroup(age);
  let min, max;
  if (group === '+18') {
    min = (tee - (protein.max * 4 + fat.max * 9)) / 4;
    max = (tee - (protein.min * 4 + fat.min * 9)) / 4;
  } else {
    min = (tee * 0.5) / 4;
    max = (tee * 0.6) / 4;
  }
  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
  };
} 