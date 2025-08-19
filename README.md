# 🏆 حاسبة لاعب كرة القدم - موصبري برو

حاسبة شاملة ومتقدمة لتغذية لاعبي كرة القدم، تجمع بين حساب السعرات الحرارية والماكروز والوزن المثالي حسب المركز.

## ✨ الميزات الرئيسية

### 🚀 الحساب التلقائي
- **نتائج فورية:** تظهر النتائج تلقائياً عند تعديل أي مدخل
- **لا حاجة لزر "احسب":** النظام يحسب في الوقت الفعلي
- **تجربة مستخدم محسنة:** رؤية التغييرات فوراً
- **زر إعادة حساب اختياري:** للتحقق من صحة النتائج

### 🎯 حساب السعرات الحرارية
- **BMR (معدل الأيض الأساسي)** باستخدام معادلة Mifflin-St Jeor
- **TDEE (إجمالي استهلاك الطاقة اليومي)** مع عوامل النشاط
- دعم للجنسين (ذكر/أنثى)
- عوامل نشاط دقيقة ومحدثة

### 🥩 حساب الماكروز (البروتين/الدهون/الكربوهيدرات)
- **نسب بروتين حسب العمر:**
  - 9-12 سنة: 1.0-1.2 غ/كغ
  - 13-17 سنة: 1.0-1.4 غ/كغ
  - 18+ سنة: 1.4-1.6 غ/كغ

- **خطط التغذية:**
  - **المحافظة (Maintain):** السعرات والبروتين ضمن النطاق الطبيعي
  - **خسارة الوزن (Cut):** تقليل السعرات من الكربوهيدرات + رفع البروتين
  - **زيادة الوزن (Bulk):** زيادة السعرات من الكربوهيدرات + رفع البروتين

- **تعديلات السعرات حسب العمر:**
  - 18+ سنة: cut (-500 إلى -300), bulk (+300 إلى +500)
  - 13-17 سنة: cut (-400 إلى -200), bulk (+200 إلى +400)
  - 9-12 سنة: cut (-200 إلى -100), bulk (+200 إلى +400)

### ⚖️ حساب الوزن المثالي
- **المعادلة الأساسية:** `base = height_cm - 100`
- **إزاحات حسب المركز:**
  - **GK (حارس المرمى):** base-5 إلى base+2
  - **CB (قلب الدفاع):** base-5 إلى base+2
  - **FB/WB (الظهير):** base-6 إلى base+0
  - **DM/CM/AM (المحور):** base-5 إلى base+0
  - **ST/CF-fast (المهاجم):** base-5 إلى base+3
  - **Winger (الجناح):** base-7 إلى base+0

### 🎨 واجهة مستخدم محسنة
- **عرض فرق السعرات بالألوان:**
  - 🟢 أخضر للزيادة (#28a745)
  - 🔴 أحمر للنقصان (#dc3545)
- **نصوص عربية كاملة**
- **تصميم متجاوب** للجوال والحاسوب

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- npm أو yarn

### التثبيت
```bash
git clone https://github.com/mosabriwork-pro/calculator-arabic.git
cd calculator-arabic
npm install
```

### التشغيل
```bash
# التطوير
npm run dev

# الاختبارات
npm test

# البناء
npm run build

# التشغيل
npm start
```

## 📚 استخدام الوحدات

### وحدة حساب الخطة الشاملة
```typescript
import { computePlan } from './src/utils/plan-calculator';

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

console.log(result.ideal_weight_kg); // { min: 70, max: 77 }
console.log(result.protein_g); // { min: 140, max: 140 }
console.log(result.calories.final_min); // 2800
```

### وحدة حساب السعرات
```typescript
import { calculateBMR, calculateTDEE } from './src/utils/calories';

const bmr = calculateBMR({
  age_years: 25,
  sex: 'male',
  weight_kg: 70,
  height_cm: 175
});

const tdee = calculateTDEE(bmr, 'moderate');
```

### وحدة حساب الوزن المثالي
```typescript
import { computeIdealWeight } from './src/utils/ideal-weight';

const idealWeight = computeIdealWeight('CB', 175);
// { min: 70, max: 77 }
```

## 🔄 كيفية عمل الحساب التلقائي

النظام يستخدم **React Hooks** مع **useMemo** للحساب التلقائي:

```typescript
const nutritionPlan = useMemo(() => {
  // الحسابات تتم تلقائياً عند تغيير أي مدخل
  const currentAge = inputValues.age !== '' ? Number(inputValues.age) : playerData.age
  const currentWeight = inputValues.weight !== '' ? Number(inputValues.weight) : playerData.weight
  const currentHeight = inputValues.height !== '' ? Number(inputValues.height) : playerData.height
  
  // إظهار النتائج تلقائياً عند وجود قيم صحيحة
  if (currentAge >= 9 && currentWeight >= 20 && currentHeight >= 140) {
    setShowResults(true)
  }
  
  // حساب BMR, TDEE, الماكروز, الوزن المثالي
  // ... جميع الحسابات
  
  return { calories, protein, carbs, fat, water, idealWeight }
}, [playerData, selectedPlan, inputValues]) // dependencies للتحديث التلقائي
```

### المميزات:
- ✅ **useMemo** مع dependencies صحيحة
- ✅ **inputValues** للتحديث في الوقت الفعلي
- ✅ **setShowResults(true)** تلقائياً
- ✅ **معالجة الأخطاء** مع إخفاء النتائج

## 🧪 الاختبارات

المشروع يحتوي على **112 اختبار** تغطي جميع الوظائف:

```bash
npm test                    # جميع الاختبارات
npm test -- --watch        # الاختبارات مع المراقبة
npm test -- --coverage     # الاختبارات مع تقرير التغطية
```

### مجموعات الاختبارات
- ✅ **Plan Calculator Tests** - اختبارات الوحدة الشاملة
- ✅ **Macros Tests** - اختبارات حساب الماكروز
- ✅ **Ideal Weight Tests** - اختبارات الوزن المثالي
- ✅ **Calories Tests** - اختبارات السعرات الحرارية
- ✅ **Calculator Tests** - اختبارات الواجهة

## 🔧 التقنيات المستخدمة

- **Next.js 14** - إطار العمل
- **TypeScript** - لغة البرمجة
- **Jest** - إطار الاختبارات
- **Tailwind CSS** - تصميم الواجهة
- **React** - واجهة المستخدم

## 📁 هيكل المشروع

```
src/
├── utils/
│   ├── plan-calculator.ts    # الوحدة الشاملة
│   ├── calories.ts           # حساب السعرات
│   ├── macros.ts             # حساب الماكروز
│   └── ideal-weight.ts       # حساب الوزن المثالي
├── __tests__/
│   ├── plan-calculator.test.ts
│   ├── calories.test.ts
│   ├── macros.test.ts
│   └── ideal-weight.test.ts
└── app/
    ├── calculator/           # الصفحة الرئيسية
    ├── admin/                # لوحة الإدارة
    └── login/                # تسجيل الدخول
```

## 🎯 أمثلة الحسابات

### مثال 1: بالغ 18+ - وزن 70 - صيانة 2500
- **البروتين:** 98-112 غ (1.4-1.6 غ/كغ)
- **الدهون:** 69-97 غ (25-35% من السعرات)
- **الكربوهيدرات:** 294-371 غ (المتبقي)
- **الوزن المثالي (CB):** 70-77 كجم

### مثال 2: بالغ 18+ - وزن 70 - bulk 2500
- **البروتين:** 140 غ (2.0 غ/كغ)
- **السعرات النهائية:** 2800-3000 (+300 إلى +500)
- **الدهون:** 78-117 غ (25-35% من السعرات النهائية)
- **الكربوهيدرات:** المتبقي بعد البروتين والدهون

## 🚨 التحقق من الأخطاء

### فحوصات الطاقة
- **تسامح دقيق:** ±1 سعرة فقط
- **فحص التوازن:** `|السعرات_المحسوبة - السعرات_المستهدفة| ≤ 1`

### منع الأخطاء الشائعة
- ❌ لا استخدام للرطل (جميع الحسابات بالكيلوغرام)
- ❌ لا تقريب مبكر (التقريب في الإخراج فقط)
- ❌ لا نسب ثابتة للكربوهيدرات (دائماً المتبقي)
- ❌ لا خطأ في حدود العمر (18+ يبدأ من 18)

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:
1. عمل Fork للمشروع
2. إنشاء فرع للميزة الجديدة
3. إضافة الاختبارات المناسبة
4. عمل Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## 📞 الدعم

للدعم والاستفسارات:
- 📧 البريد الإلكتروني: talal200265@gmail.com
- 🌐 الموقع: https://mosabri.top

---

**موصبري برو** - حاسبة متقدمة لتغذية لاعبي كرة القدم ⚽
