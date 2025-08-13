import { computePlan, formatPlanDisplay, getPlanMidpoints } from '../utils/plan-calculator';

describe('Plan Calculator Tests', () => {
  describe('Test Cases from Requirements', () => {
    test('بالغ 18+ — وزن 70 — صيانة 2500 — Maintain', () => {
      const result = computePlan({
        name: 'أحمد',
        age_years: 25,
        sex: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'maintain',
        calories_maint: 2500
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
      
      // الوزن المثالي: 175-100 = 75، CB: -5 إلى +2 = 70-77
      expect(result.ideal_weight_kg.min).toBe(70);
      expect(result.ideal_weight_kg.max).toBe(77);
      
      // التحقق من صحة السعرات (±4)
      expect(Math.abs(result.checks.kcal_from_min_combo - 2500)).toBeLessThanOrEqual(4);
      expect(Math.abs(result.checks.kcal_from_max_combo - 2500)).toBeLessThanOrEqual(4);
    });

    test('بالغ 18+ — وزن 70 — صيانة 2500 — Cut (Δ −500 ↔ −300 ⇒ 2000–2200)', () => {
      const result = computePlan({
        name: 'أحمد',
        age_years: 25,
        sex: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'cut',
        calories_maint: 2500
      });
      
      // البروتين: 140 غ ثابت (2.0×70)
      expect(result.protein_g.min).toBe(140);
      expect(result.protein_g.max).toBe(140);
      
      // السعرات: 2000 – 2200 (-500 إلى -300)
      expect(result.calories.maintain).toBe(2500);
      expect(result.calories.final_min).toBe(2000);
      expect(result.calories.final_max).toBe(2200);
      expect(result.calories.delta_min).toBe(-500);
      expect(result.calories.delta_max).toBe(-300);
      
      // عرض فرق السعرات
      expect(result.ui.delta_badge_min.text).toBe('-500');
      expect(result.ui.delta_badge_max.text).toBe('-300');
      expect(result.ui.delta_badge_min.color).toBe('red');
      expect(result.ui.delta_badge_max.color).toBe('red');
      
      // الوزن المثالي: 70-77
      expect(result.ideal_weight_kg.min).toBe(70);
      expect(result.ideal_weight_kg.max).toBe(77);
    });

    test('بالغ 18+ — وزن 70 — صيانة 2500 — Bulk (Δ +300 ↔ +500 ⇒ 2800–3000)', () => {
      const result = computePlan({
        name: 'أحمد',
        age_years: 25,
        sex: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'bulk',
        calories_maint: 2500
      });
      
      // البروتين: 140 غ ثابت
      expect(result.protein_g.min).toBe(140);
      expect(result.protein_g.max).toBe(140);
      
      // السعرات: 2800 – 3000 (+300 إلى +500)
      expect(result.calories.maintain).toBe(2500);
      expect(result.calories.final_min).toBe(2800);
      expect(result.calories.final_max).toBe(3000);
      expect(result.calories.delta_min).toBe(300);
      expect(result.calories.delta_max).toBe(500);
      
      // عرض فرق السعرات
      expect(result.ui.delta_badge_min.text).toBe('+300');
      expect(result.ui.delta_badge_max.text).toBe('+500');
      expect(result.ui.delta_badge_min.color).toBe('green');
      expect(result.ui.delta_badge_max.color).toBe('green');
    });

    test('عمر 13–18 — وزن 55 — صيانة 2300 — Maintain', () => {
      const result = computePlan({
        name: 'محمد',
        age_years: 16,
        sex: 'male',
        height_cm: 170,
        weight_kg: 55,
        activity_level: 'moderate',
        position: 'DM/CM/AM',
        goal: 'maintain',
        calories_maint: 2300
      });
      
      // البروتين: 55 – 77 غ (1.0-1.4 غ/كجم)
      expect(result.protein_g.min).toBe(55);
      expect(result.protein_g.max).toBe(77);
      
      // السعرات: 2300 (بدون تغيير)
      expect(result.calories.maintain).toBe(2300);
      expect(result.calories.final_min).toBe(2300);
      expect(result.calories.final_max).toBe(2300);
      
      // الوزن المثالي: 170-100 = 70، DM/CM/AM: -5 إلى 0 = 65-70
      expect(result.ideal_weight_kg.min).toBe(65);
      expect(result.ideal_weight_kg.max).toBe(70);
    });

    test('عمر 13–18 — وزن 55 — صيانة 2300 — Cut (1900–2100)', () => {
      const result = computePlan({
        name: 'محمد',
        age_years: 16,
        sex: 'male',
        height_cm: 170,
        weight_kg: 55,
        activity_level: 'moderate',
        position: 'DM/CM/AM',
        goal: 'cut',
        calories_maint: 2300
      });
      
      // البروتين: 88 – 110 غ (1.6–2.0×55)
      expect(result.protein_g.min).toBe(88);
      expect(result.protein_g.max).toBe(110);
      
      // السعرات: 1900 – 2100 (-400 إلى -200)
      expect(result.calories.final_min).toBe(1900);
      expect(result.calories.final_max).toBe(2100);
      expect(result.calories.delta_min).toBe(-400);
      expect(result.calories.delta_max).toBe(-200);
      
      // عرض فرق السعرات
      expect(result.ui.delta_badge_min.text).toBe('-400');
      expect(result.ui.delta_badge_max.text).toBe('-200');
      expect(result.ui.delta_badge_min.color).toBe('red');
    });

    test('عمر 13–18 — وزن 55 — صيانة 2300 — Bulk (2500–2700)', () => {
      const result = computePlan({
        name: 'محمد',
        age_years: 16,
        sex: 'male',
        height_cm: 170,
        weight_kg: 55,
        activity_level: 'moderate',
        position: 'DM/CM/AM',
        goal: 'bulk',
        calories_maint: 2300
      });
      
      // البروتين: 88 – 110 غ (1.6–2.0×55)
      expect(result.protein_g.min).toBe(88);
      expect(result.protein_g.max).toBe(110);
      
      // السعرات: 2500 – 2700 (+200 إلى +400)
      expect(result.calories.final_min).toBe(2500);
      expect(result.calories.final_max).toBe(2700);
      expect(result.calories.delta_min).toBe(200);
      expect(result.calories.delta_max).toBe(400);
      
      // عرض فرق السعرات
      expect(result.ui.delta_badge_min.text).toBe('+200');
      expect(result.ui.delta_badge_max.text).toBe('+400');
      expect(result.ui.delta_badge_min.color).toBe('green');
    });

    test('عمر 9–12 — وزن 35 — صيانة 2000 — Maintain', () => {
      const result = computePlan({
        name: 'علي',
        age_years: 10,
        sex: 'male',
        height_cm: 150,
        weight_kg: 35,
        activity_level: 'moderate',
        position: 'Winger',
        goal: 'maintain',
        calories_maint: 2000
      });
      
      // البروتين: 35 – 42 غ (1.0-1.2 غ/كجم)
      expect(result.protein_g.min).toBe(35);
      expect(result.protein_g.max).toBe(42);
      
      // السعرات: 2000 (بدون تغيير)
      expect(result.calories.maintain).toBe(2000);
      expect(result.calories.final_min).toBe(2000);
      expect(result.calories.final_max).toBe(2000);
      
      // الوزن المثالي: 150-100 = 50، Winger: -7 إلى 0 = 43-50
      expect(result.ideal_weight_kg.min).toBe(43);
      expect(result.ideal_weight_kg.max).toBe(50);
    });

    test('عمر 9–12 — وزن 35 — صيانة 2000 — Bulk (2200–2400)', () => {
      const result = computePlan({
        name: 'علي',
        age_years: 10,
        sex: 'male',
        height_cm: 150,
        weight_kg: 35,
        activity_level: 'moderate',
        position: 'Winger',
        goal: 'bulk',
        calories_maint: 2000
      });
      
      // البروتين: 42 – 53 غ (1.2–1.5×35)
      expect(result.protein_g.min).toBe(42);
      expect(result.protein_g.max).toBe(53);
      
      // السعرات: 2200 – 2400 (+200 إلى +400)
      expect(result.calories.final_min).toBe(2200);
      expect(result.calories.final_max).toBe(2400);
      expect(result.calories.delta_min).toBe(200);
      expect(result.calories.delta_max).toBe(400);
    });

    test('عمر 9–12 — وزن 35 — صيانة 2000 — Cut (1800–1900)', () => {
      const result = computePlan({
        name: 'علي',
        age_years: 10,
        sex: 'male',
        height_cm: 150,
        weight_kg: 35,
        activity_level: 'moderate',
        position: 'Winger',
        goal: 'cut',
        calories_maint: 2000
      });
      
      // البروتين: 42 – 53 غ (1.2–1.5×35)
      expect(result.protein_g.min).toBe(42);
      expect(result.protein_g.max).toBe(53);
      
      // السعرات: 1800 – 1900 (-200 إلى -100)
      expect(result.calories.final_min).toBe(1800);
      expect(result.calories.final_max).toBe(1900);
      expect(result.calories.delta_min).toBe(-200);
      expect(result.calories.delta_max).toBe(-100);
    });
  });

  describe('Age Group Classification', () => {
    test('Age 9-12 classification', () => {
      const result = computePlan({
        name: 'test',
        age_years: 10,
        sex: 'male',
        height_cm: 150,
        weight_kg: 40,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'maintain',
        calories_maint: 1800
      });
      
      // يجب أن يكون البروتين 1.0-1.2 غ/كجم
      expect(result.protein_g.min).toBe(40); // 1.0 * 40
      expect(result.protein_g.max).toBe(48); // 1.2 * 40
    });

    test('Age 13-18 classification', () => {
      const result = computePlan({
        name: 'test',
        age_years: 16,
        sex: 'male',
        height_cm: 170,
        weight_kg: 60,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'maintain',
        calories_maint: 2200
      });
      
      // يجب أن يكون البروتين 1.0-1.4 غ/كجم
      expect(result.protein_g.min).toBe(60); // 1.0 * 60
      expect(result.protein_g.max).toBe(84); // 1.4 * 60
    });

    test('Age 18+ classification', () => {
      const result = computePlan({
        name: 'test',
        age_years: 25,
        sex: 'male',
        height_cm: 180,
        weight_kg: 80,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'maintain',
        calories_maint: 2800
      });
      
      // يجب أن يكون البروتين 1.4-1.6 غ/كجم
      expect(result.protein_g.min).toBe(112); // 1.4 * 80
      expect(result.protein_g.max).toBe(128); // 1.6 * 80
    });

    test('Age 18 should be classified as 18+', () => {
      const result = computePlan({
        name: 'test',
        age_years: 18,
        sex: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'maintain',
        calories_maint: 2500
      });
      
      // يجب أن يكون البروتين 1.4-1.6 غ/كجم (18+ وليس 13-18)
      expect(result.protein_g.min).toBe(98); // 1.4 * 70
      expect(result.protein_g.max).toBe(112); // 1.6 * 70
    });
  });

  describe('Ideal Weight Calculations', () => {
    test('GK position: height 180cm → 75–82 kg', () => {
      const result = computePlan({
        name: 'test',
        age_years: 25,
        sex: 'male',
        height_cm: 180,
        weight_kg: 80,
        activity_level: 'moderate',
        position: 'GK',
        goal: 'maintain',
        calories_maint: 2800
      });
      
      // GK: base=80, min=80-5=75, max=80+2=82
      expect(result.ideal_weight_kg.min).toBe(75);
      expect(result.ideal_weight_kg.max).toBe(82);
    });

    test('CB position: height 175cm → 70–77 kg', () => {
      const result = computePlan({
        name: 'test',
        age_years: 25,
        sex: 'male',
        height_cm: 175,
        weight_kg: 75,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'maintain',
        calories_maint: 2500
      });
      
      // CB: base=75, min=75-5=70, max=75+2=77
      expect(result.ideal_weight_kg.min).toBe(70);
      expect(result.ideal_weight_kg.max).toBe(77);
    });

    test('FB/WB position: height 171cm → 65–71 kg', () => {
      const result = computePlan({
        name: 'test',
        age_years: 25,
        sex: 'male',
        height_cm: 171,
        weight_kg: 70,
        activity_level: 'moderate',
        position: 'FB/WB',
        goal: 'maintain',
        calories_maint: 2500
      });
      
      // FB/WB: base=71, min=71-6=65, max=71+0=71
      expect(result.ideal_weight_kg.min).toBe(65);
      expect(result.ideal_weight_kg.max).toBe(71);
    });

    test('ST/CF-fast position: height 185cm → 80–88 kg', () => {
      const result = computePlan({
        name: 'test',
        age_years: 25,
        sex: 'male',
        height_cm: 185,
        weight_kg: 85,
        activity_level: 'moderate',
        position: 'ST/CF-fast',
        goal: 'maintain',
        calories_maint: 3000
      });
      
      // ST/CF-fast: base=85, min=85-5=80, max=85+3=88
      expect(result.ideal_weight_kg.min).toBe(80);
      expect(result.ideal_weight_kg.max).toBe(88);
    });
  });

  describe('Input Validation', () => {
    test('Age below 9 should throw error', () => {
      expect(() => {
        computePlan({
          name: 'test',
          age_years: 8,
          sex: 'male',
          height_cm: 150,
          weight_kg: 40,
          activity_level: 'moderate',
          position: 'CB',
          goal: 'maintain',
          calories_maint: 1800
        });
      }).toThrow('هذه الحاسبة تدعم أعمار 9 سنوات فأكثر.');
    });

    test('Height below 140 should throw error', () => {
      expect(() => {
        computePlan({
          name: 'test',
          age_years: 15,
          sex: 'male',
          height_cm: 130,
          weight_kg: 50,
          activity_level: 'moderate',
          position: 'CB',
          goal: 'maintain',
          calories_maint: 2000
        });
      }).toThrow('الطول يجب أن يكون بين 140 و 210 سم');
    });

    test('Height above 210 should throw error', () => {
      expect(() => {
        computePlan({
          name: 'test',
          age_years: 25,
          sex: 'male',
          height_cm: 220,
          weight_kg: 80,
          activity_level: 'moderate',
          position: 'CB',
          goal: 'maintain',
          calories_maint: 2800
        });
      }).toThrow('الطول يجب أن يكون بين 140 و 210 سم');
    });

    test('Weight below 30 should throw error', () => {
      expect(() => {
        computePlan({
          name: 'test',
          age_years: 15,
          sex: 'male',
          height_cm: 160,
          weight_kg: 25,
          activity_level: 'moderate',
          position: 'CB',
          goal: 'maintain',
          calories_maint: 2000
        });
      }).toThrow('الوزن يجب أن يكون بين 30 و 140 كجم');
    });

    test('Weight above 140 should throw error', () => {
      expect(() => {
        computePlan({
          name: 'test',
          age_years: 25,
          sex: 'male',
          height_cm: 180,
          weight_kg: 150,
          activity_level: 'moderate',
          position: 'CB',
          goal: 'maintain',
          calories_maint: 3000
        });
      }).toThrow('الوزن يجب أن يكون بين 30 و 140 كجم');
    });

    test('Calories below 800 should throw error', () => {
      expect(() => {
        computePlan({
          name: 'test',
          age_years: 20,
          sex: 'male',
          height_cm: 170,
          weight_kg: 60,
          activity_level: 'moderate',
          position: 'CB',
          goal: 'maintain',
          calories_maint: 600
        });
      }).toThrow('السعرات يجب أن تكون 800 سعرة على الأقل');
    });
  });

  describe('Energy Balance Checks', () => {
    test('Energy balance should be within ±1 kcal for maintain goal', () => {
      const result = computePlan({
        name: 'test',
        age_years: 25,
        sex: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'maintain',
        calories_maint: 2500
      });
      
      expect(Math.abs(result.checks.kcal_from_min_combo - result.checks.calories_target_min)).toBeLessThanOrEqual(1);
      expect(Math.abs(result.checks.kcal_from_max_combo - result.checks.calories_target_max)).toBeLessThanOrEqual(1);
    });

    test('Energy balance should be within ±1 kcal for cut goal', () => {
      const result = computePlan({
        name: 'test',
        age_years: 25,
        sex: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'cut',
        calories_maint: 2500
      });
      
      expect(Math.abs(result.checks.kcal_from_min_combo - result.checks.calories_target_min)).toBeLessThanOrEqual(1);
      expect(Math.abs(result.checks.kcal_from_max_combo - result.checks.calories_target_max)).toBeLessThanOrEqual(1);
    });

    test('Energy balance should be within ±1 kcal for bulk goal', () => {
      const result = computePlan({
        name: 'test',
        age_years: 25,
        sex: 'male',
        height_cm: 175,
        weight_kg: 70,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'bulk',
        calories_maint: 2500
      });
      
      expect(Math.abs(result.checks.kcal_from_min_combo - result.checks.calories_target_min)).toBeLessThanOrEqual(1);
      expect(Math.abs(result.checks.kcal_from_max_combo - result.checks.calories_target_max)).toBeLessThanOrEqual(1);
    });
  });

  describe('Formatting Functions', () => {
    test('formatPlanDisplay for maintain goal', () => {
      const plan = {
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
        ideal_weight_kg: { min: 70, max: 77 },
        ui: {
          delta_badge_min: { text: null, color: null },
          delta_badge_max: { text: null, color: null }
        },
        notes: 'test',
        checks: {
          kcal_from_min_combo: 2000,
          kcal_from_max_combo: 2000,
          calories_target_min: 2000,
          calories_target_max: 2000
        }
      };
      
      const formatted = formatPlanDisplay(plan as any);
      
      expect(formatted.protein).toBe('البروتين: غ 100 – 120');
      expect(formatted.fat).toBe('الدهون: غ 60 – 80');
      expect(formatted.carbs).toBe('الكربوهيدرات: غ 200 – 250');
      expect(formatted.calories).toBe('السعرات: 2000 – 2000 سعرة');
      expect(formatted.ideal_weight).toBe('الوزن المثالي: من 70 إلى 77 كجم');
      expect(formatted.delta).toBe('');
    });

    test('formatPlanDisplay for bulk goal', () => {
      const plan = {
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
        ideal_weight_kg: { min: 70, max: 77 },
        ui: {
          delta_badge_min: { text: '+300', color: 'green' as const },
          delta_badge_max: { text: '+500', color: 'green' as const }
        },
        notes: 'test',
        checks: {
          kcal_from_min_combo: 2300,
          kcal_from_max_combo: 2500,
          calories_target_min: 2300,
          calories_target_max: 2500
        }
      };
      
      const formatted = formatPlanDisplay(plan as any);
      
      expect(formatted.calories).toBe('السعرات: 2300 – 2500 سعرة (2000 + +300 إلى +500)');
      expect(formatted.delta).toBe('التعديل: +300 إلى +500 سعرة');
    });

    test('getPlanMidpoints', () => {
      const plan = {
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
        ideal_weight_kg: { min: 70, max: 77 },
        ui: {
          delta_badge_min: { text: null, color: null },
          delta_badge_max: { text: null, color: null }
        },
        notes: 'test',
        checks: {
          kcal_from_min_combo: 2000,
          kcal_from_max_combo: 2000,
          calories_target_min: 2000,
          calories_target_max: 2000
        }
      };
      
      const midpoints = getPlanMidpoints(plan as any);
      
      expect(midpoints.protein).toBe(110); // (100 + 120) / 2
      expect(midpoints.fat).toBe(70);      // (60 + 80) / 2
      expect(midpoints.carbs).toBe(225);   // (200 + 250) / 2
      expect(midpoints.calories).toBe(2000); // (2000 + 2000) / 2
      expect(midpoints.ideal_weight).toBe(74); // (70 + 77) / 2
    });
  });

  describe('Edge Cases', () => {
    test('Minimum valid inputs', () => {
      const result = computePlan({
        name: 'test',
        age_years: 9,
        sex: 'male',
        height_cm: 140,
        weight_kg: 30,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'maintain',
        calories_maint: 800
      });
      
      expect(result.protein_g.min).toBeGreaterThan(0);
      expect(result.fat_g.min).toBeGreaterThan(0);
      expect(result.carb_g.min).toBeGreaterThanOrEqual(0);
      expect(result.ideal_weight_kg.min).toBeGreaterThan(0);
    });

    test('Maximum valid inputs', () => {
      const result = computePlan({
        name: 'test',
        age_years: 80,
        sex: 'male',
        height_cm: 210,
        weight_kg: 140,
        activity_level: 'moderate',
        position: 'CB',
        goal: 'maintain',
        calories_maint: 5000
      });
      
      expect(result.protein_g.max).toBeGreaterThan(0);
      expect(result.fat_g.max).toBeGreaterThan(0);
      expect(result.carb_g.max).toBeGreaterThan(0);
      expect(result.ideal_weight_kg.max).toBeGreaterThan(0);
    });
  });
});
