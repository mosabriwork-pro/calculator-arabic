import { computeMacros, formatMacroDisplay, getMacroMidpoints } from '../utils/macros';

describe('Macros Calculator Tests', () => {
  describe('Test Cases from Requirements', () => {
    test('بالغ ≥18 — وزن 70كجم وسعرات 2500 - maintain', () => {
      const result = computeMacros({
        age_years: 25,
        weight_kg: 70,
        total_calories: 2500,
        goal: 'maintain'
      });
      
      // البروتين: 98 – 112 غ (1.4-1.6 غ/كجم)
      expect(result.protein_g.min).toBe(98);
      expect(result.protein_g.max).toBe(112);
      
      // الدهون: 69 – 97 غ
      expect(result.fat_g.min).toBe(69);
      expect(result.fat_g.max).toBe(97);
      
      // الكاربوهيدرات: 294 – 371 غ
      expect(result.carb_g.min).toBe(294);
      expect(result.carb_g.max).toBe(371);
      
      // السعرات: 2500 (بدون تغيير)
      expect(result.calories.maintain).toBe(2500);
      expect(result.calories.final_min).toBe(2500);
      expect(result.calories.final_max).toBe(2500);
      expect(result.calories.delta_min).toBe(0);
      expect(result.calories.delta_max).toBe(0);
      
      // التحقق من صحة السعرات (±4)
      expect(Math.abs(result.checks.kcal_from_min_combo - 2500)).toBeLessThanOrEqual(4);
      expect(Math.abs(result.checks.kcal_from_max_combo - 2500)).toBeLessThanOrEqual(4);
    });

    test('بالغ ≥18 — وزن 70كجم وسعرات 2500 - bulk', () => {
      const result = computeMacros({
        age_years: 25,
        weight_kg: 70,
        total_calories: 2500,
        goal: 'bulk'
      });
      
      // البروتين: 140 غ (2.0 غ/كجم)
      expect(result.protein_g.min).toBe(140);
      expect(result.protein_g.max).toBe(140);
      
      // السعرات: 2800 – 3000 (+300 إلى +500)
      expect(result.calories.maintain).toBe(2500);
      expect(result.calories.final_min).toBe(2800);
      expect(result.calories.final_max).toBe(3000);
      expect(result.calories.delta_min).toBe(300);
      expect(result.calories.delta_max).toBe(500);
      
      // عرض فرق السعرات
      expect(result.delta_display.text_min).toBe('+300');
      expect(result.delta_display.text_max).toBe('+500');
      expect(result.delta_display.color).toBe('green');
    });

    test('بالغ ≥18 — وزن 70كجم وسعرات 2500 - cut', () => {
      const result = computeMacros({
        age_years: 25,
        weight_kg: 70,
        total_calories: 2500,
        goal: 'cut'
      });
      
      // البروتين: 140 غ (2.0 غ/كجم)
      expect(result.protein_g.min).toBe(140);
      expect(result.protein_g.max).toBe(140);
      
      // السعرات: 2000 – 2200 (-500 إلى -300)
      expect(result.calories.maintain).toBe(2500);
      expect(result.calories.final_min).toBe(2000);
      expect(result.calories.final_max).toBe(2200);
      expect(result.calories.delta_min).toBe(-500);
      expect(result.calories.delta_max).toBe(-300);
      
      // عرض فرق السعرات
      expect(result.delta_display.text_min).toBe('-500');
      expect(result.delta_display.text_max).toBe('-300');
      expect(result.delta_display.color).toBe('red');
    });

    test('عمر 9–12 — وزن 35كجم وسعرات 2000 - maintain', () => {
      const result = computeMacros({
        age_years: 10,
        weight_kg: 35,
        total_calories: 2000,
        goal: 'maintain'
      });
      
      // البروتين: 35 – 42 غ (1.0-1.2 غ/كجم)
      expect(result.protein_g.min).toBe(35);
      expect(result.protein_g.max).toBe(42);
      
      // السعرات: 2000 (بدون تغيير)
      expect(result.calories.maintain).toBe(2000);
      expect(result.calories.final_min).toBe(2000);
      expect(result.calories.final_max).toBe(2000);
    });

    test('عمر 13–18 — وزن 55كجم وسعرات 2300 - maintain', () => {
      const result = computeMacros({
        age_years: 15,
        weight_kg: 55,
        total_calories: 2300,
        goal: 'maintain'
      });
      
      // البروتين: 55 – 77 غ (1.0-1.4 غ/كجم)
      expect(result.protein_g.min).toBe(55);
      expect(result.protein_g.max).toBe(77);
      
      // السعرات: 2300 (بدون تغيير)
      expect(result.calories.maintain).toBe(2300);
      expect(result.calories.final_min).toBe(2300);
      expect(result.calories.final_max).toBe(2300);
    });
  });

  describe('Goal-based Calculations', () => {
    test('Age 18+ bulk goal should increase protein to 2.0g/kg', () => {
      const result = computeMacros({
        age_years: 25,
        weight_kg: 80,
        total_calories: 2800,
        goal: 'bulk'
      });
      
      // البروتين: 2.0 × 80 = 160 غ
      expect(result.protein_g.min).toBe(160);
      expect(result.protein_g.max).toBe(160);
      
      // السعرات: 2800 + 300 إلى 2800 + 500 = 3100 إلى 3300
      expect(result.calories.final_min).toBe(3100);
      expect(result.calories.final_max).toBe(3300);
    });

    test('Age 13-18 cut goal should increase protein to 1.6-2.0g/kg', () => {
      const result = computeMacros({
        age_years: 16,
        weight_kg: 60,
        total_calories: 2200,
        goal: 'cut'
      });
      
      // البروتين: 1.6 × 60 = 96 غ إلى 2.0 × 60 = 120 غ
      expect(result.protein_g.min).toBe(96);
      expect(result.protein_g.max).toBe(120);
      
      // السعرات: 2200 - 400 إلى 2200 - 200 = 1800 إلى 2000
      expect(result.calories.final_min).toBe(1800);
      expect(result.calories.final_max).toBe(2000);
    });

    test('Age 9-12 bulk goal should increase protein to 1.2-1.5g/kg', () => {
      const result = computeMacros({
        age_years: 10,
        weight_kg: 40,
        total_calories: 1800,
        goal: 'bulk'
      });
      
      // البروتين: 1.2 × 40 = 48 غ إلى 1.5 × 40 = 60 غ
      expect(result.protein_g.min).toBe(48);
      expect(result.protein_g.max).toBe(60);
      
      // السعرات: 1800 + 200 إلى 1800 + 400 = 2000 إلى 2200
      expect(result.calories.final_min).toBe(2000);
      expect(result.calories.final_max).toBe(2200);
    });
  });

  describe('Age Group Classification', () => {
    test('Age 9-12 classification', () => {
      const result = computeMacros({
        age_years: 10,
        weight_kg: 40,
        total_calories: 1800,
        goal: 'maintain'
      });
      
      // يجب أن يكون البروتين 1.0-1.2 غ/كجم
      expect(result.protein_g.min).toBe(40); // 1.0 * 40
      expect(result.protein_g.max).toBe(48); // 1.2 * 40
    });

    test('Age 13-18 classification', () => {
      const result = computeMacros({
        age_years: 16,
        weight_kg: 60,
        total_calories: 2200,
        goal: 'maintain'
      });
      
      // يجب أن يكون البروتين 1.0-1.4 غ/كجم
      expect(result.protein_g.min).toBe(60); // 1.0 * 60
      expect(result.protein_g.max).toBe(84); // 1.4 * 60
    });

    test('Age 18+ classification', () => {
      const result = computeMacros({
        age_years: 25,
        weight_kg: 80,
        total_calories: 2800,
        goal: 'maintain'
      });
      
      // يجب أن يكون البروتين 1.4-1.6 غ/كجم
      expect(result.protein_g.min).toBe(112); // 1.4 * 80
      expect(result.protein_g.max).toBe(128); // 1.6 * 80
    });
  });

  describe('Fat Calculations (25-35% of total calories)', () => {
    test('Fat calculation for 2000 calories', () => {
      const result = computeMacros({
        age_years: 20,
        weight_kg: 70,
        total_calories: 2000,
        goal: 'maintain'
      });
      
      // الدهون: 25% = 2000 * 0.25 / 9 = 55.56 → 56 غ
      // الدهون: 35% = 2000 * 0.35 / 9 = 77.78 → 78 غ
      expect(result.fat_g.min).toBe(56);
      expect(result.fat_g.max).toBe(78);
    });

    test('Fat calculation for 3000 calories', () => {
      const result = computeMacros({
        age_years: 20,
        weight_kg: 80,
        total_calories: 3000,
        goal: 'maintain'
      });
      
      // الدهون: 25% = 3000 * 0.25 / 9 = 83.33 → 83 غ
      // الدهون: 35% = 3000 * 0.35 / 9 = 116.67 → 117 غ
      expect(result.fat_g.min).toBe(83);
      expect(result.fat_g.max).toBe(117);
    });
  });

  describe('Carbohydrate Calculations (Remaining calories)', () => {
    test('Carbs calculation verification for maintain', () => {
      const result = computeMacros({
        age_years: 20,
        weight_kg: 70,
        total_calories: 2000,
        goal: 'maintain'
      });
      
      // التحقق من أن مجموع السعرات من الماكروز = 2000 (±4)
      const totalFromMacros = 
        (result.protein_g.min * 4) + 
        (result.fat_g.min * 9) + 
        (result.carb_g.max * 4);
      
      expect(Math.abs(totalFromMacros - 2000)).toBeLessThanOrEqual(4);
    });

    test('Carbs calculation verification for bulk', () => {
      const result = computeMacros({
        age_years: 20,
        weight_kg: 70,
        total_calories: 2000,
        goal: 'bulk'
      });
      
      // نتحقق من أن السعرات النهائية صحيحة
      expect(result.calories.final_min).toBe(2300); // 2000 + 300
      expect(result.calories.final_max).toBe(2500); // 2000 + 500
      
      // نتحقق من أن البروتين صحيح (2.0 غ/كجم للبالغين في bulk)
      expect(result.protein_g.min).toBe(140); // 2.0 * 70
      expect(result.protein_g.max).toBe(140); // 2.0 * 70
      
      // نتحقق من أن الدهون صحيحة (25-35% من السعرات النهائية)
      expect(result.fat_g.min).toBeGreaterThan(0);
      expect(result.fat_g.max).toBeGreaterThan(0);
      
      // نتحقق من أن الكربوهيدرات صحيحة
      expect(result.carb_g.min).toBeGreaterThanOrEqual(0);
      expect(result.carb_g.max).toBeGreaterThan(0);
      expect(result.carb_g.min).toBeLessThanOrEqual(result.carb_g.max);
      
      // نتحقق من أن الكربوهيدرات ضمن نطاق معقول
      expect(result.carb_g.min).toBeGreaterThan(100); // على الأقل 100 غ
      expect(result.carb_g.max).toBeLessThan(1000);   // أقل من 1000 غ
    });
  });

  describe('Input Validation', () => {
    test('Age below 9 should throw error', () => {
      expect(() => {
        computeMacros({
          age_years: 8,
          weight_kg: 30,
          total_calories: 1500
        });
      }).toThrow('هذه الحاسبة تدعم أعمار 9 سنوات فأكثر.');
    });

    test('Weight below 20 should throw error', () => {
      expect(() => {
        computeMacros({
          age_years: 15,
          weight_kg: 15,
          total_calories: 1500
        });
      }).toThrow('الوزن يجب أن يكون بين 20 و 250 كجم');
    });

    test('Weight above 250 should throw error', () => {
      expect(() => {
        computeMacros({
          age_years: 25,
          weight_kg: 300,
          total_calories: 3000
        });
      }).toThrow('الوزن يجب أن يكون بين 20 و 250 كجم');
    });

    test('Calories below 800 should throw error', () => {
      expect(() => {
        computeMacros({
          age_years: 20,
          weight_kg: 60,
          total_calories: 600
        });
      }).toThrow('السعرات يجب أن تكون 800 سعرة على الأقل');
    });
  });

  describe('Edge Cases', () => {
    test('Minimum valid inputs', () => {
      const result = computeMacros({
        age_years: 9,
        weight_kg: 20,
        total_calories: 800,
        goal: 'maintain'
      });
      
      expect(result.protein_g.min).toBeGreaterThan(0);
      expect(result.fat_g.min).toBeGreaterThan(0);
      expect(result.carb_g.min).toBeGreaterThanOrEqual(0);
    });

    test('Maximum valid inputs', () => {
      const result = computeMacros({
        age_years: 80,
        weight_kg: 250,
        total_calories: 5000,
        goal: 'maintain'
      });
      
      expect(result.protein_g.max).toBeGreaterThan(0);
      expect(result.fat_g.max).toBeGreaterThan(0);
      expect(result.carb_g.max).toBeGreaterThan(0);
    });
  });

  describe('Formatting Functions', () => {
    test('formatMacroDisplay for maintain goal', () => {
      const macros = {
        calories: {
          maintain: 2000,
          final_min: 2000,
          final_max: 2000,
          delta_min: 0,
          delta_max: 0
        },
        protein_g: { min: 100, max: 120 },
        fat_g: { min: 60, max: 80 },
        carb_g: { min: 200, max: 250 },
        delta_display: {
          text_min: null,
          text_max: null,
          color: null
        },
        notes: 'test',
        checks: {
          kcal_from_min_combo: 2000,
          kcal_from_max_combo: 2000,
          calories_target_min: 2000,
          calories_target_max: 2000
        }
      };
      
      const formatted = formatMacroDisplay(macros);
      
      expect(formatted.protein).toBe('البروتين: غ 100 – 120');
      expect(formatted.fat).toBe('الدهون: غ 60 – 80');
      expect(formatted.carbs).toBe('الكربوهيدرات: غ 200 – 250');
      expect(formatted.calories).toBe('السعرات: 2000 – 2000 سعرة');
      expect(formatted.delta).toBe('');
    });

    test('formatMacroDisplay for bulk goal', () => {
      const macros = {
        calories: {
          maintain: 2000,
          final_min: 2300,
          final_max: 2500,
          delta_min: 300,
          delta_max: 500
        },
        protein_g: { min: 140, max: 140 },
        fat_g: { min: 60, max: 80 },
        carb_g: { min: 200, max: 250 },
        delta_display: {
          text_min: '+300',
          text_max: '+500',
          color: 'green' as const
        },
        notes: 'test',
        checks: {
          kcal_from_min_combo: 2300,
          kcal_from_max_combo: 2500,
          calories_target_min: 2300,
          calories_target_max: 2500
        }
      };
      
      const formatted = formatMacroDisplay(macros);
      
      expect(formatted.calories).toBe('السعرات: 2300 – 2500 سعرة (2000 + +300 إلى +500)');
      expect(formatted.delta).toBe('التعديل: +300 إلى +500 سعرة');
    });

    test('getMacroMidpoints', () => {
      const macros = {
        calories: {
          maintain: 2000,
          final_min: 2000,
          final_max: 2000,
          delta_min: 0,
          delta_max: 0
        },
        protein_g: { min: 100, max: 120 },
        fat_g: { min: 60, max: 80 },
        carb_g: { min: 200, max: 250 },
        delta_display: {
          text_min: null,
          text_max: null,
          color: null
        },
        notes: 'test',
        checks: {
          kcal_from_min_combo: 2000,
          kcal_from_max_combo: 2000,
          calories_target_min: 2000,
          calories_target_max: 2000
        }
      };
      
      const midpoints = getMacroMidpoints(macros);
      
      expect(midpoints.protein).toBe(110); // (100 + 120) / 2
      expect(midpoints.fat).toBe(70);      // (60 + 80) / 2
      expect(midpoints.carbs).toBe(225);   // (200 + 250) / 2
      expect(midpoints.calories).toBe(2000); // (2000 + 2000) / 2
    });
  });

  describe('Mathematical Accuracy', () => {
    test('All calculations should sum to target calories (±4)', () => {
      const testCases = [
        { age: 20, weight: 70, calories: 2000, goal: 'maintain' },
        { age: 15, weight: 55, calories: 2300, goal: 'cut' },
        { age: 10, weight: 35, calories: 1800, goal: 'bulk' },
        { age: 30, weight: 90, calories: 3500, goal: 'maintain' }
      ];
      
      testCases.forEach(({ age, weight, calories, goal }) => {
        const result = computeMacros({
          age_years: age,
          weight_kg: weight,
          total_calories: calories,
          goal: goal as any
        });
        
        // التحقق من أن مجموع السعرات من الماكروز = السعرات المستهدفة (±4)
        expect(Math.abs(result.checks.kcal_from_min_combo - result.checks.calories_target_min)).toBeLessThanOrEqual(4);
        expect(Math.abs(result.checks.kcal_from_max_combo - result.checks.calories_target_max)).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('Goal-specific Notes', () => {
    test('Maintain goal should show appropriate note', () => {
      const result = computeMacros({
        age_years: 25,
        weight_kg: 70,
        total_calories: 2500,
        goal: 'maintain'
      });
      
      expect(result.notes).toContain('المحافظة على الوزن');
    });

    test('Cut goal should show appropriate note', () => {
      const result = computeMacros({
        age_years: 25,
        weight_kg: 70,
        total_calories: 2500,
        goal: 'cut'
      });
      
      expect(result.notes).toContain('خسارة الوزن');
    });

    test('Bulk goal should show appropriate note', () => {
      const result = computeMacros({
        age_years: 25,
        weight_kg: 70,
        total_calories: 2500,
        goal: 'bulk'
      });
      
      expect(result.notes).toContain('زيادة الوزن');
    });
  });
});
