import { 
  computeIdealWeight, 
  formatIdealWeightDisplay, 
  getSupportedPositions,
  isValidPosition,
  type Position 
} from '../utils/ideal-weight';

describe('Ideal Weight Calculator Tests', () => {
  describe('Test Cases from Requirements', () => {
    test('GK: height=180 → 75–82', () => {
      const result = computeIdealWeight({
        height_cm: 180,
        position: 'حارس مرمى'
      });
      
      expect(result.ideal_weight_kg.min).toBe(75);
      expect(result.ideal_weight_kg.max).toBe(82);
      expect(result.base).toBe(80); // 180 - 100
      expect(result.position_normalized).toBe('GK');
    });

    test('CB: height=175 → 70–77', () => {
      const result = computeIdealWeight({
        height_cm: 175,
        position: 'قلب الدفاع'
      });
      
      expect(result.ideal_weight_kg.min).toBe(70);
      expect(result.ideal_weight_kg.max).toBe(77);
      expect(result.base).toBe(75); // 175 - 100
      expect(result.position_normalized).toBe('CB');
    });

    test('FB/WB: height=171 → 65–71', () => {
      const result = computeIdealWeight({
        height_cm: 171,
        position: 'ظهير'
      });
      
      expect(result.ideal_weight_kg.min).toBe(65);
      expect(result.ideal_weight_kg.max).toBe(71);
      expect(result.base).toBe(71); // 171 - 100
      expect(result.position_normalized).toBe('FB/WB');
    });

    test('DM/CM/AM: height=180 → 75–80', () => {
      const result = computeIdealWeight({
        height_cm: 180,
        position: 'محور'
      });
      
      expect(result.ideal_weight_kg.min).toBe(75);
      expect(result.ideal_weight_kg.max).toBe(80);
      expect(result.base).toBe(80); // 180 - 100
      expect(result.position_normalized).toBe('DM/CM/AM');
    });

    test('ST/CF-fast: height=185 → 80–88', () => {
      const result = computeIdealWeight({
        height_cm: 185,
        position: 'مهاجم'
      });
      
      expect(result.ideal_weight_kg.min).toBe(80);
      expect(result.ideal_weight_kg.max).toBe(88);
      expect(result.base).toBe(85); // 185 - 100
      expect(result.position_normalized).toBe('ST/CF-fast');
    });

    test('Winger: height=177 → 70–77', () => {
      const result = computeIdealWeight({
        height_cm: 177,
        position: 'جناح'
      });
      
      expect(result.ideal_weight_kg.min).toBe(70);
      expect(result.ideal_weight_kg.max).toBe(77);
      expect(result.base).toBe(77); // 177 - 100
      expect(result.position_normalized).toBe('Winger');
    });
  });

  describe('Position Mapping Tests', () => {
    test('Arabic position names should map correctly', () => {
      const testCases = [
        { input: 'حارس مرمى', expected: 'GK' },
        { input: 'قلب الدفاع', expected: 'CB' },
        { input: 'ظهير', expected: 'FB/WB' },
        { input: 'محور', expected: 'DM/CM/AM' },
        { input: 'مهاجم', expected: 'ST/CF-fast' },
        { input: 'جناح', expected: 'Winger' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = computeIdealWeight({
          height_cm: 175,
          position: input
        });
        expect(result.position_normalized).toBe(expected);
      });
    });

    test('English position names should map correctly', () => {
      const testCases = [
        { input: 'GK', expected: 'GK' },
        { input: 'CB', expected: 'CB' },
        { input: 'FB', expected: 'FB/WB' },
        { input: 'CM', expected: 'DM/CM/AM' },
        { input: 'ST', expected: 'ST/CF-fast' },
        { input: 'Winger', expected: 'Winger' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = computeIdealWeight({
          height_cm: 175,
          position: input
        });
        expect(result.position_normalized).toBe(expected);
      });
    });
  });

  describe('Weight Comparison Tests', () => {
    test('Weight below minimum should show correct note', () => {
      const result = computeIdealWeight({
        height_cm: 175,
        position: 'محور',
        weight_kg: 65
      });
      
      expect(result.ideal_weight_kg.min).toBe(70);
      expect(result.ideal_weight_kg.max).toBe(75);
      expect(result.notes).toContain('أقل من الحد الأدنى بـ 5 كجم');
    });

    test('Weight above maximum should show correct note', () => {
      const result = computeIdealWeight({
        height_cm: 175,
        position: 'محور',
        weight_kg: 80
      });
      
      expect(result.ideal_weight_kg.min).toBe(70);
      expect(result.ideal_weight_kg.max).toBe(75);
      expect(result.notes).toContain('أعلى من الحد الأقصى بـ 5 كجم');
    });

    test('Weight within range should show correct note', () => {
      const result = computeIdealWeight({
        height_cm: 175,
        position: 'محور',
        weight_kg: 72
      });
      
      expect(result.ideal_weight_kg.min).toBe(70);
      expect(result.ideal_weight_kg.max).toBe(75);
      expect(result.notes).toContain('ضمن المدى المثالي');
    });

    test('Weight not provided should not show comparison', () => {
      const result = computeIdealWeight({
        height_cm: 175,
        position: 'محور'
      });
      
      expect(result.notes).toBe('الوزن المثالي: من 70 إلى 75 كجم');
      expect(result.notes).not.toContain('أقل من');
      expect(result.notes).not.toContain('أعلى من');
      expect(result.notes).not.toContain('ضمن المدى');
    });
  });

  describe('Input Validation Tests', () => {
    test('Height below 140 should throw error', () => {
      expect(() => {
        computeIdealWeight({
          height_cm: 135,
          position: 'محور'
        });
      }).toThrow('الطول يجب أن يكون بين 140 و 210 سم');
    });

    test('Height above 210 should throw error', () => {
      expect(() => {
        computeIdealWeight({
          height_cm: 215,
          position: 'محور'
        });
      }).toThrow('الطول يجب أن يكون بين 140 و 210 سم');
    });

    test('Invalid position should throw error', () => {
      expect(() => {
        computeIdealWeight({
          height_cm: 175,
          position: 'مركز غير موجود'
        });
      }).toThrow('المركز غير مدعوم');
    });

    test('Empty position should throw error', () => {
      expect(() => {
        computeIdealWeight({
          height_cm: 175,
          position: ''
        });
      }).toThrow('المركز غير مدعوم');
    });
  });

  describe('Edge Cases Tests', () => {
    test('Minimum valid height (140cm)', () => {
      const result = computeIdealWeight({
        height_cm: 140,
        position: 'محور'
      });
      
      expect(result.base).toBe(40); // 140 - 100
      expect(result.ideal_weight_kg.min).toBe(35); // 40 - 5
      expect(result.ideal_weight_kg.max).toBe(40); // 40 + 0
    });

    test('Maximum valid height (210cm)', () => {
      const result = computeIdealWeight({
        height_cm: 210,
        position: 'مهاجم'
      });
      
      expect(result.base).toBe(110); // 210 - 100
      expect(result.ideal_weight_kg.min).toBe(105); // 110 - 5
      expect(result.ideal_weight_kg.max).toBe(113); // 110 + 3
    });

    test('Height exactly 175cm (middle range)', () => {
      const result = computeIdealWeight({
        height_cm: 175,
        position: 'محور'
      });
      
      expect(result.base).toBe(75); // 175 - 100
      expect(result.ideal_weight_kg.min).toBe(70); // 75 - 5
      expect(result.ideal_weight_kg.max).toBe(75); // 75 + 0
    });
  });

  describe('Formatting Functions Tests', () => {
    test('formatIdealWeightDisplay should format correctly', () => {
      const output = {
        ideal_weight_kg: { min: 70, max: 75 },
        base: 75,
        position_normalized: 'DM/CM/AM' as Position,
        notes: 'الوزن المثالي: من 70 إلى 75 كجم (ضمن المدى المثالي)'
      };
      
      const formatted = formatIdealWeightDisplay(output);
      
      expect(formatted.weight).toBe('الوزن المثالي: من 70 إلى 75 كجم');
      expect(formatted.comparison).toBe('✅ ضمن الوزن المثالي');
    });

    test('formatIdealWeightDisplay for weight below minimum', () => {
      const output = {
        ideal_weight_kg: { min: 70, max: 75 },
        base: 75,
        position_normalized: 'DM/CM/AM' as Position,
        notes: 'الوزن المثالي: من 70 إلى 75 كجم (أقل من الحد الأدنى بـ 5 كجم)'
      };
      
      const formatted = formatIdealWeightDisplay(output);
      
      expect(formatted.weight).toBe('الوزن المثالي: من 70 إلى 75 كجم');
      expect(formatted.comparison).toBe('⚠️ أقل من الوزن المثالي');
    });

    test('formatIdealWeightDisplay for weight above maximum', () => {
      const output = {
        ideal_weight_kg: { min: 70, max: 75 },
        base: 75,
        position_normalized: 'DM/CM/AM' as Position,
        notes: 'الوزن المثالي: من 70 إلى 75 كجم (أعلى من الحد الأقصى بـ 5 كجم)'
      };
      
      const formatted = formatIdealWeightDisplay(output);
      
      expect(formatted.weight).toBe('الوزن المثالي: من 70 إلى 75 كجم');
      expect(formatted.comparison).toBe('⚠️ أعلى من الوزن المثالي');
    });
  });

  describe('Utility Functions Tests', () => {
    test('getSupportedPositions should return all supported positions', () => {
      const positions = getSupportedPositions();
      
      expect(positions).toContain('حارس مرمى');
      expect(positions).toContain('قلب الدفاع');
      expect(positions).toContain('ظهير');
      expect(positions).toContain('محور');
      expect(positions).toContain('مهاجم');
      expect(positions).toContain('جناح');
      expect(positions).toContain('GK');
      expect(positions).toContain('CB');
      expect(positions).toContain('FB');
      expect(positions).toContain('CM');
      expect(positions).toContain('ST');
      expect(positions).toContain('Winger');
    });

    test('isValidPosition should return true for valid positions', () => {
      expect(isValidPosition('حارس مرمى')).toBe(true);
      expect(isValidPosition('محور')).toBe(true);
      expect(isValidPosition('GK')).toBe(true);
      expect(isValidPosition('CM')).toBe(true);
    });

    test('isValidPosition should return false for invalid positions', () => {
      expect(isValidPosition('مركز غير موجود')).toBe(false);
      expect(isValidPosition('')).toBe(false);
      expect(isValidPosition('random text')).toBe(false);
    });
  });

  describe('Mathematical Accuracy Tests', () => {
    test('All calculations should follow the base formula correctly', () => {
      const testCases = [
        { height: 160, position: 'محور', expectedBase: 60, expectedMin: 55, expectedMax: 60 },
        { height: 185, position: 'مهاجم', expectedBase: 85, expectedMin: 80, expectedMax: 88 },
        { height: 170, position: 'جناح', expectedBase: 70, expectedMin: 63, expectedMax: 70 }
      ];
      
      testCases.forEach(({ height, position, expectedBase, expectedMin, expectedMax }) => {
        const result = computeIdealWeight({
          height_cm: height,
          position: position
        });
        
        expect(result.base).toBe(expectedBase);
        expect(result.ideal_weight_kg.min).toBe(expectedMin);
        expect(result.ideal_weight_kg.max).toBe(expectedMax);
      });
    });

    test('Rounding should work correctly', () => {
      // Test with height that would result in decimal values
      const result = computeIdealWeight({
        height_cm: 175.5, // This will be treated as 175.5
        position: 'محور'
      });
      
      expect(result.base).toBe(75.5); // 175.5 - 100
      expect(result.ideal_weight_kg.min).toBe(71); // Math.round(75.5 - 5) = Math.round(70.5) = 71
      expect(result.ideal_weight_kg.max).toBe(76); // Math.round(75.5 + 0) = Math.round(75.5) = 76
    });
  });
});
