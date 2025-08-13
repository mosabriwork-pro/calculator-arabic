import {
  calculateBMR,
  calculateTDEE,
  calculateCalories,
  ACTIVITY_FACTORS,
  type Gender,
  type ActivityLevel
} from '../utils/calories';

describe('Calories Calculator Tests', () => {
  describe('BMR Calculations', () => {
    test('ذكر، وزن 70 كجم، طول 175 سم، عمر 25 سنة', () => {
      const bmr = calculateBMR({
        gender: 'ذكر',
        weightKg: 70,
        heightCm: 175,
        ageYears: 25
      });
      
      // الحساب: 66.47 + (13.75×70) + (5×175) − (4.7×25)
      // = 66.47 + 962.5 + 875 − 117.5 = 1786.47 → 1786
      expect(bmr).toBe(1786);
    });

    test('أنثى، وزن 60 كجم، طول 165 سم، عمر 25 سنة', () => {
      const bmr = calculateBMR({
        gender: 'أنثى',
        weightKg: 60,
        heightCm: 165,
        ageYears: 25
      });
      
      // الحساب: 655 + (9.6×60) + (1.85×165) − (4.7×25)
      // = 655 + 576 + 305.25 − 117.5 = 1418.75 → 1419
      expect(bmr).toBe(1419);
    });

    test('ذكر، وزن 80 كجم، طول 180 سم، عمر 30 سنة', () => {
      const bmr = calculateBMR({
        gender: 'ذكر',
        weightKg: 80,
        heightCm: 180,
        ageYears: 30
      });
      
      // الحساب: 66.47 + (13.75×80) + (5×180) − (4.7×30)
      // = 66.47 + 1100 + 900 − 141 = 1925.47 → 1925
      expect(bmr).toBe(1925);
    });
  });

  describe('TDEE Calculations', () => {
    test('BMR 1786 مع كسول (بدون تمرين)', () => {
      const tdee = calculateTDEE({
        bmr: 1786,
        activityLabel: 'كسول (بدون تمرين)'
      });
      
      // TDEE = 1786 × 1.2 = 2143.2 → 2143
      expect(tdee).toBe(2143);
    });

    test('BMR 1786 مع نشاط متوسط (3-4 أيام تمرين اسبوعيا)', () => {
      const tdee = calculateTDEE({
        bmr: 1786,
        activityLabel: 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
      });
      
      // TDEE = 1786 × 1.55 = 2768.3 → 2768
      expect(tdee).toBe(2768);
    });

    test('BMR 1419 مع نشاط خفيف (1-2 يوم تمرين اسبوعيا)', () => {
      const tdee = calculateTDEE({
        bmr: 1419,
        activityLabel: 'نشاط خفيف (1-2 يوم تمرين اسبوعيا)'
      });
      
      // TDEE = 1419 × 1.376 = 1952.544 → 1953
      expect(tdee).toBe(1953);
    });

    test('BMR 1925 مع نشاط مكثف (تمرين يومي + نشاط بدني)', () => {
      const tdee = calculateTDEE({
        bmr: 1925,
        activityLabel: 'نشاط مكثف (تمرين يومي + نشاط بدني)'
      });
      
      // TDEE = 1925 × 1.9 = 3657.5 → 3658
      expect(tdee).toBe(3658);
    });
  });

  describe('Activity Factors', () => {
    test('جميع عوامل النشاط موجودة وصحيحة', () => {
      expect(ACTIVITY_FACTORS['كسول (بدون تمرين)']).toBe(1.2);
      expect(ACTIVITY_FACTORS['نشاط خفيف (1-2 يوم تمرين اسبوعيا)']).toBe(1.376);
      expect(ACTIVITY_FACTORS['نشاط متوسط (3-4 أيام تمرين اسبوعيا)']).toBe(1.55);
      expect(ACTIVITY_FACTORS['نشاط عالي (5-6 أيام تمرين اسبوعيا)']).toBe(1.725);
      expect(ACTIVITY_FACTORS['نشاط مكثف (تمرين يومي + نشاط بدني)']).toBe(1.9);
    });
  });

  describe('Input Validation', () => {
    test('مدخلات صحيحة', () => {
      const result = calculateCalories({
        gender: 'ذكر',
        weightKg: 70,
        heightCm: 175,
        ageYears: 25,
        activityLevel: 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.bmr).toBe(1786);
      expect(result.tdee).toBe(2768);
    });

    test('وزن منخفض جداً', () => {
      const result = calculateCalories({
        gender: 'ذكر',
        weightKg: 15,
        heightCm: 175,
        ageYears: 25,
        activityLevel: 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('الوزن يجب أن يكون بين 20 و 250 كجم');
    });

    test('وزن مرتفع جداً', () => {
      const result = calculateCalories({
        gender: 'ذكر',
        weightKg: 300,
        heightCm: 175,
        ageYears: 25,
        activityLevel: 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('الوزن يجب أن يكون بين 20 و 250 كجم');
    });

    test('طول منخفض جداً', () => {
      const result = calculateCalories({
        gender: 'ذكر',
        weightKg: 70,
        heightCm: 80,
        ageYears: 25,
        activityLevel: 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('الطول يجب أن يكون بين 100 و 230 سم');
    });

    test('عمر منخفض جداً', () => {
      const result = calculateCalories({
        gender: 'ذكر',
        weightKg: 70,
        heightCm: 175,
        ageYears: 5,
        activityLevel: 'نشاط متوسط (3-4 أيام تمرين اسبوعيا)'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('العمر يجب أن يكون بين 9 و 80 سنة');
    });
  });

  describe('Edge Cases', () => {
    test('قيم حدية صحيحة', () => {
      const result = calculateCalories({
        gender: 'أنثى',
        weightKg: 20, // الحد الأدنى
        heightCm: 100, // الحد الأدنى
        ageYears: 9, // الحد الأدنى
        activityLevel: 'كسول (بدون تمرين)'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.bmr).toBeGreaterThan(0);
      expect(result.tdee).toBeGreaterThan(0);
    });

    test('قيم حدية عليا صحيحة', () => {
      const result = calculateCalories({
        gender: 'ذكر',
        weightKg: 250, // الحد الأعلى
        heightCm: 230, // الحد الأعلى
        ageYears: 80, // الحد الأعلى
        activityLevel: 'نشاط مكثف (تمرين يومي + نشاط بدني)'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.bmr).toBeGreaterThan(0);
      expect(result.tdee).toBeGreaterThan(0);
    });
  });
});
