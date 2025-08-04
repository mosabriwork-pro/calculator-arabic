'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

interface NutritionData {
  name: string;
  age: number;
  height: number;
  currentWeight: number;
  position: string;
  activityLevel: string;
  country: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  idealWeight: number;
  weightGain: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  maintenance: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  weightLoss: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

function PrintReportContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<NutritionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get data from URL parameters
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        setData(parsedData);
      } catch (error) {
        console.error('Error parsing data:', error);
      }
    }
    setIsLoading(false);
  }, [searchParams]);

  // Remove auto-print functionality - let user manually trigger print

  if (isLoading) {
    return <div className="loading">جاري تحميل التقرير...</div>;
  }

  if (!data) {
    return <div className="error">لا توجد بيانات متاحة</div>;
  }

  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-report">
      {/* Print Button - Only visible on screen */}
      <div className="print-button-container">
        <button onClick={handlePrint} className="print-button">
          🖨️ طباعة التقرير
        </button>
      </div>
      {/* Page 1: Cover */}
      <div className="page cover-page">
        <div className="cover-background"></div>
                          <div className="cover-content">
           <div className="cover-logo">
             <img src="/logo.png" alt="موصبري" />
           </div>
           <h1 className="main-title">تقرير غذائي للاعب</h1>
          <div className="player-info">
            <h2>{data.name || 'لم يتم إدخال الاسم'}</h2>
            <p className="date">{currentDate}</p>
            <p className="subtitle">حاسبة لاعب كرة القدم - موصبري</p>
          </div>
          <div className="cover-decoration">
            <div className="decoration-line"></div>
            <div className="decoration-circle"></div>
            <div className="decoration-line"></div>
          </div>
        </div>
      </div>

      {/* Page 2: Player Information */}
      <div className="page">
        <div className="page-logo">
          <img src="/logoforweb.png" alt="موصبري" />
        </div>
        <div className="page-header">
          <div className="header-icon">👤</div>
          <h2>معلومات اللاعب</h2>
          <p className="header-subtitle">بياناتك الشخصية والرياضية لهذا التقرير</p>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">الاسم:</span>
            <span className="value">{data.name || 'لم يتم إدخال الاسم'}</span>
          </div>
          <div className="info-item">
            <span className="label">العمر:</span>
            <span className="value">{data.age || 'لم يتم إدخال العمر'} سنة</span>
          </div>
          <div className="info-item">
            <span className="label">الطول:</span>
            <span className="value">{data.height || 'لم يتم إدخال الطول'} سم</span>
          </div>
          <div className="info-item">
            <span className="label">الوزن الحالي:</span>
            <span className="value">{data.currentWeight || 'لم يتم إدخال الوزن'} كجم</span>
          </div>
          <div className="info-item">
            <span className="label">المركز:</span>
            <span className="value">{data.position || 'لم يتم إدخال المركز'}</span>
          </div>
          <div className="info-item">
            <span className="label">مستوى النشاط:</span>
            <span className="value">{data.activityLevel || 'لم يتم إدخال مستوى النشاط'}</span>
          </div>
        </div>
        <div className="report-footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام موصبري للتغذية الرياضية</p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Page 3: Basic Results */}
      <div className="page">
        <div className="page-logo">
          <img src="/logoforweb.png" alt="موصبري" />
        </div>
        <div className="page-header">
          <div className="header-icon">📊</div>
          <h2>النتائج الأساسية</h2>
          <p className="header-subtitle">احتياجاتك الغذائية المحسوبة بناء على قواعد علمية</p>
        </div>
        <div className="results-grid">
          <div className="result-card">
            <div className="card-icon">🔥</div>
            <h3>السعرات الحرارية</h3>
            <div className="value">{data.calories || 'غير محسوب'} سعرة</div>
          </div>
          <div className="result-card">
            <div className="card-icon">💪</div>
            <h3>البروتين</h3>
            <div className="value">{data.protein || 'غير محسوب'} جرام</div>
          </div>
          <div className="result-card">
            <div className="card-icon">🌾</div>
            <h3>الكربوهيدرات</h3>
            <div className="value">{data.carbs || 'غير محسوب'} جرام</div>
          </div>
          <div className="result-card">
            <div className="card-icon">🥑</div>
            <h3>الدهون</h3>
            <div className="value">{data.fat || 'غير محسوب'} جرام</div>
          </div>
          <div className="result-card">
            <div className="card-icon">💧</div>
            <h3>الماء</h3>
            <div className="value">{data.water || 'غير محسوب'} لتر</div>
          </div>
          <div className="result-card">
            <div className="card-icon">⚖️</div>
            <h3>الوزن المثالي</h3>
            <div className="value">{data.idealWeight || 'غير محسوب'} كجم</div>
          </div>
        </div>
        <div className="report-footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام موصبري للتغذية الرياضية</p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Page 4: Weight & Nutrition Analysis */}
      <div className="page">
        <div className="page-logo">
          <img src="/logoforweb.png" alt="موصبري" />
        </div>
        <div className="page-header">
          <div className="header-icon">🔍</div>
          <h2>تحليل الوزن والتغذية</h2>
          <p className="header-subtitle">تحليل شامل لوزنك واحتياجاتك الغذائية</p>
        </div>
        <div className="analysis-section">
          <h3>تحليل الوزن</h3>
          <div className="weight-analysis">
            <div className="analysis-item">
              <span className="label">الوزن الحالي:</span>
              <span className="value">{data.currentWeight || 'غير محدد'} كجم</span>
            </div>
            <div className="analysis-item">
              <span className="label">الوزن المثالي:</span>
              <span className="value">{data.idealWeight || 'غير محدد'} كجم</span>
            </div>
            <div className="analysis-item">
              <span className="label">الفرق المطلوب:</span>
              <span className="value">
                {data.currentWeight && data.idealWeight 
                  ? `${Math.abs(data.currentWeight - data.idealWeight).toFixed(1)} كجم`
                  : 'غير محدد'}
              </span>
            </div>
          </div>
        </div>
        <div className="analysis-section">
          <h3>الاحتياجات الغذائية</h3>
          <div className="nutrition-needs">
            <div className="need-item">
              <span className="label">البروتين اليومي:</span>
              <span className="value">{data.protein || 'غير محسوب'} جرام</span>
            </div>
            <div className="need-item">
              <span className="label">الكربوهيدرات اليومية:</span>
              <span className="value">{data.carbs || 'غير محسوب'} جرام</span>
            </div>
            <div className="need-item">
              <span className="label">الدهون اليومية:</span>
              <span className="value">{data.fat || 'غير محسوب'} جرام</span>
            </div>
            <div className="need-item">
              <span className="label">الماء اليومي:</span>
              <span className="value">{data.water || 'غير محسوب'} لتر</span>
            </div>
            <div className="need-item">
              <span className="label">إجمالي السعرات:</span>
              <span className="value">{data.calories || 'غير محسوب'} سعرة</span>
            </div>
          </div>
        </div>
        <div className="report-footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام موصبري للتغذية الرياضية</p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Page 5: Three Nutrition Plans */}
      <div className="page">
        <div className="page-logo">
          <img src="/logoforweb.png" alt="موصبري" />
        </div>
        <div className="page-header">
          <div className="header-icon">📋</div>
          <h2>الخطط الغذائية الثلاث</h2>
          <p className="header-subtitle">خطط مخصصة لتحقيق أهدافك الرياضية</p>
        </div>
        <div className="plans-grid">
          <div className="plan-card weight-gain">
            <div className="plan-header">
              <div className="plan-icon">📈</div>
              <h3>خطة زيادة الوزن الصحية</h3>
            </div>
            <div className="plan-details">
              <div className="detail-item">
                <span className="label">السعرات:</span>
                <span className="value">{data.weightGain?.calories || 'غير محسوب'}</span>
              </div>
              <div className="detail-item">
                <span className="label">البروتين:</span>
                <span className="value">{data.weightGain?.protein || 'غير محسوب'} جرام</span>
              </div>
              <div className="detail-item">
                <span className="label">الكربوهيدرات:</span>
                <span className="value">{data.weightGain?.carbs || 'غير محسوب'} جرام</span>
              </div>
              <div className="detail-item">
                <span className="label">الدهون:</span>
                <span className="value">{data.weightGain?.fat || 'غير محسوب'} جرام</span>
              </div>
            </div>
          </div>

          <div className="plan-card maintenance">
            <div className="plan-header">
              <div className="plan-icon">⚖️</div>
              <h3>خطة المحافظة على الوزن</h3>
            </div>
            <div className="plan-details">
              <div className="detail-item">
                <span className="label">السعرات:</span>
                <span className="value">{data.maintenance?.calories || 'غير محسوب'}</span>
              </div>
              <div className="detail-item">
                <span className="label">البروتين:</span>
                <span className="value">{data.maintenance?.protein || 'غير محسوب'} جرام</span>
              </div>
              <div className="detail-item">
                <span className="label">الكربوهيدرات:</span>
                <span className="value">{data.maintenance?.carbs || 'غير محسوب'} جرام</span>
              </div>
              <div className="detail-item">
                <span className="label">الدهون:</span>
                <span className="value">{data.maintenance?.fat || 'غير محسوب'} جرام</span>
              </div>
            </div>
          </div>

          <div className="plan-card weight-loss">
            <div className="plan-header">
              <div className="plan-icon">📉</div>
              <h3>خطة خسارة الوزن الصحية</h3>
            </div>
            <div className="plan-details">
              <div className="detail-item">
                <span className="label">السعرات:</span>
                <span className="value">{data.weightLoss?.calories || 'غير محسوب'}</span>
              </div>
              <div className="detail-item">
                <span className="label">البروتين:</span>
                <span className="value">{data.weightLoss?.protein || 'غير محسوب'} جرام</span>
              </div>
              <div className="detail-item">
                <span className="label">الكربوهيدرات:</span>
                <span className="value">{data.weightLoss?.carbs || 'غير محسوب'} جرام</span>
              </div>
              <div className="detail-item">
                <span className="label">الدهون:</span>
                <span className="value">{data.weightLoss?.fat || 'غير محسوب'} جرام</span>
              </div>
            </div>
          </div>
        </div>
        <div className="report-footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام موصبري للتغذية الرياضية</p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Page 6: Performance Tips */}
      <div className="page">
        <div className="page-logo">
          <img src="/logoforweb.png" alt="موسبري" />
        </div>
        <div className="page-header">
          <div className="header-icon">💡</div>
          <h2>نصائح الأداء</h2>
          <p className="header-subtitle">نصائح ذهبية لتحسين أدائك الرياضي</p>
        </div>
        <div className="tips-section">
          <div className="tip-item">
            <div className="tip-icon">💧</div>
            <div className="tip-content">
              <h3>شرب الماء</h3>
              <p>احرص على شرب {data.water || '2-3'} لتر من الماء يومياً، خاصة قبل وأثناء وبعد التدريبات.</p>
            </div>
          </div>
          <div className="tip-item">
            <div className="tip-icon">⏰</div>
            <div className="tip-content">
              <h3>توقيت الوجبات</h3>
              <p>تناول وجبة خفيفة قبل التدريب بساعتين، ووجبة متوازنة بعد التدريب بنصف ساعة.</p>
            </div>
          </div>
          <div className="tip-item">
            <div className="tip-icon">🔄</div>
            <div className="tip-content">
              <h3>المرونة</h3>
              <p>يمكن تعديل الكميات حسب مستوى نشاطك اليومي واحتياجاتك الشخصية.</p>
            </div>
          </div>
          <div className="tip-item">
            <div className="tip-icon">🥑</div>
            <div className="tip-content">
              <h3>نسبة الدهون</h3>
              <p>إحرص على تناول الدهون الصحية من مصادر مثل المكسرات والأسماك والزيوت النباتية.</p>
            </div>
          </div>
          <div className="tip-item">
            <div className="tip-icon">👨‍⚕️</div>
            <div className="tip-content">
              <h3>نصيحة عامة</h3>
              <p>للحصول على خطة غذائية احترافية مصممة خصيصًا للاعبي كرة القدم، اطلع على كتيب التغذية الرياضي المتوفر على موقعنا وابدأ رحلتك نحو الأداء المثالي!</p>
            </div>
          </div>
        </div>
        <div className="report-footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام موصبري للتغذية الرياضية</p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Page 7: Sleep & Recovery + Footer */}
      <div className="page">
        <div className="page-logo">
          <img src="/logoforweb.png" alt="موسبري" />
        </div>
        <div className="page-header">
          <div className="header-icon">😴</div>
          <h2>النوم والتعافي</h2>
          <p className="header-subtitle">أساسيات النوم والتعافي لتحقيق أفضل أداء</p>
        </div>
        <div className="sleep-section">
          <h3>ساعات النوم الموصى بها</h3>
          <div className="sleep-recommendations">
            <p>• اللاعبين النشطين: 7-9 ساعات يومياً</p>
            <p>• في أيام التدريب المكثف: 8-10 ساعات</p>
            <p>• قبل المباريات المهمة: 9-10 ساعات</p>
          </div>
        </div>
        <div className="recovery-section">
          <h3>نصائح للتعافي</h3>
          <div className="recovery-tips">
            <p>• القيلولة: 20-30 دقيقة بعد التدريبات المكثفة</p>
            <p>• الأيام الحارة: زيادة استهلاك الماء والملح</p>
            <p>• الحمل العالي: راحة إضافية وتغذية مكثفة</p>
            <p>• التعافي النشط: تمارين خفيفة في أيام الراحة</p>
          </div>
        </div>
        <div className="report-footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام موصبري للتغذية الرياضية</p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </div>

      <style jsx>{`
        .print-report {
          direction: rtl;
          font-family: 'Cairo', sans-serif;
          background: white;
          color: #333;
          line-height: 1.6;
        }

                 .page {
           page-break-after: always;
           page-break-inside: avoid;
           min-height: 297mm;
           width: 210mm;
           margin: 0 auto;
           padding: 20mm;
           box-sizing: border-box;
           background: 
             linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%),
             radial-gradient(circle at 10% 20%, rgba(76, 175, 80, 0.03) 0%, transparent 50%),
             radial-gradient(circle at 90% 80%, rgba(46, 125, 50, 0.03) 0%, transparent 50%),
             radial-gradient(circle at 50% 50%, rgba(27, 94, 32, 0.02) 0%, transparent 50%),
             repeating-linear-gradient(
               45deg,
               transparent,
               transparent 2px,
               rgba(76, 175, 80, 0.01) 2px,
               rgba(76, 175, 80, 0.01) 4px
             );
           position: relative;
           box-shadow: 0 0 20px rgba(0,0,0,0.05);
           overflow: hidden;
           display: flex;
           flex-direction: column;
         }

        .page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4CAF50, #2E7D32, #4CAF50);
        }

        .page::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(ellipse at top left, rgba(76, 175, 80, 0.02) 0%, transparent 70%),
            radial-gradient(ellipse at bottom right, rgba(46, 125, 50, 0.02) 0%, transparent 70%),
            linear-gradient(45deg, transparent 49%, rgba(76, 175, 80, 0.005) 50%, transparent 51%);
          pointer-events: none;
          z-index: 0;
        }

        .page > * {
          position: relative;
          z-index: 1;
        }

        .page-logo {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          z-index: 10;
        }

        .page-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .page-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #4CAF50;
          padding-bottom: 15px;
          position: relative;
          margin-top: 20px;
        }

        .page-header::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #4CAF50, #2E7D32);
          border-radius: 2px;
        }

        .header-icon {
          font-size: 24px;
          margin-bottom: 10px;
        }

        .page-header h2 {
          color: #2E7D32;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 10px 0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }

        .header-subtitle {
          color: #888;
          font-size: 14px;
          margin: 0;
          font-weight: 400;
          font-style: italic;
        }

                 /* Cover Page */
         .cover-page {
           display: flex;
           align-items: center;
           justify-content: center;
           text-align: center;
           background: 
             linear-gradient(135deg, #4CAF50 0%, #2E7D32 50%, #1B5E20 100%),
             radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
             radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%),
             repeating-linear-gradient(
               45deg,
               transparent,
               transparent 10px,
               rgba(255,255,255,0.02) 10px,
               rgba(255,255,255,0.02) 12px
             );
           color: white;
           position: relative;
           overflow: hidden;
           padding: 40mm;
           box-sizing: border-box;
         }

        .cover-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 15px,
              rgba(255,255,255,0.03) 15px,
              rgba(255,255,255,0.03) 17px
            );
        }

                 .cover-content {
           position: relative;
           z-index: 2;
         }

         .cover-logo {
           margin-bottom: 30px;
         }

                                       .cover-logo img {
             width: 240px;
             height: 240px;
             object-fit: contain;
           }

         .cover-content h1 {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 40px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          background: linear-gradient(45deg, #ffffff, #f0f0f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .player-info h2 {
          font-size: 32px;
          margin-bottom: 20px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }

        .date {
          font-size: 18px;
          margin-bottom: 15px;
          opacity: 0.9;
        }

        .subtitle {
          font-size: 16px;
          opacity: 0.8;
        }

        .cover-decoration {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 40px;
          gap: 15px;
        }

        .decoration-line {
          width: 60px;
          height: 2px;
          background: rgba(255,255,255,0.6);
        }

        .decoration-circle {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255,255,255,0.8);
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 30px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: 
            linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%),
            radial-gradient(circle at top left, rgba(76, 175, 80, 0.05) 0%, transparent 50%);
          border-radius: 12px;
          border-right: 4px solid #4CAF50;
          box-shadow: 
            0 2px 8px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.8);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .info-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #4CAF50, #2E7D32);
        }

        .info-item:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 4px 12px rgba(0,0,0,0.15),
            inset 0 1px 0 rgba(255,255,255,0.9);
        }

        .info-item .label {
          font-weight: 600;
          color: #2E7D32;
        }

        .info-item .value {
          font-weight: 500;
        }

                 /* Results Grid */
         .results-grid {
           display: grid;
           grid-template-columns: 1fr 1fr;
           gap: 15px;
           margin-top: 30px;
           margin-bottom: 40px;
         }

         .result-card {
           background: 
             linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%),
             radial-gradient(circle at top right, rgba(76, 175, 80, 0.1) 0%, transparent 50%),
             radial-gradient(circle at bottom left, rgba(46, 125, 50, 0.05) 0%, transparent 50%);
           padding: 20px;
           border-radius: 16px;
           text-align: center;
           border: 2px solid #4CAF50;
           box-shadow: 
             0 4px 12px rgba(76, 175, 80, 0.2),
             inset 0 1px 0 rgba(255,255,255,0.8);
           position: relative;
           overflow: hidden;
         }

        .result-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #4CAF50, #2E7D32);
        }

        .result-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%);
          pointer-events: none;
        }

        .card-icon {
          font-size: 24px;
          margin-bottom: 10px;
        }

                 .result-card h3 {
           color: #2E7D32;
           font-size: 16px;
           margin-bottom: 12px;
           font-weight: 600;
         }

         .result-card .value {
           font-size: 20px;
           font-weight: 700;
           color: #1B5E20;
         }

                 /* Analysis Sections */
         .analysis-section {
           margin-bottom: 30px;
         }

        .analysis-section h3 {
          color: #2E7D32;
          font-size: 22px;
          margin-bottom: 20px;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 10px;
          position: relative;
        }

        .analysis-section h3::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 40px;
          height: 2px;
          background: #2E7D32;
        }

        .weight-analysis, .nutrition-needs {
          display: grid;
          gap: 15px;
        }

        .analysis-item, .need-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: 
            linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%),
            radial-gradient(circle at top left, rgba(76, 175, 80, 0.03) 0%, transparent 50%);
          border-radius: 8px;
          border-left: 4px solid #4CAF50;
          box-shadow: 
            0 2px 6px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.8);
          position: relative;
          overflow: hidden;
        }

        .analysis-item::before, .need-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, #4CAF50, #2E7D32);
        }

        .analysis-item .label, .need-item .label {
          font-weight: 600;
          color: #2E7D32;
        }

                 /* Plans Grid */
         .plans-grid {
           display: grid;
           grid-template-columns: 1fr;
           gap: 20px;
           margin-top: 30px;
           margin-bottom: 40px;
         }

                 .plan-card {
           padding: 20px;
           border-radius: 16px;
           border: 3px solid;
           box-shadow: 
             0 4px 12px rgba(0,0,0,0.1),
             inset 0 1px 0 rgba(255,255,255,0.8);
           position: relative;
           overflow: hidden;
         }

        .plan-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .plan-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%);
          pointer-events: none;
        }

        .plan-card.weight-gain {
          background: 
            linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%),
            radial-gradient(circle at top right, rgba(255, 152, 0, 0.1) 0%, transparent 50%);
          border-color: #FF9800;
        }

        .plan-card.weight-gain::before {
          background: linear-gradient(90deg, #FF9800, #F57C00);
        }

        .plan-card.maintenance {
          background: 
            linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%),
            radial-gradient(circle at top right, rgba(76, 175, 80, 0.1) 0%, transparent 50%);
          border-color: #4CAF50;
        }

        .plan-card.maintenance::before {
          background: linear-gradient(90deg, #4CAF50, #2E7D32);
        }

        .plan-card.weight-loss {
          background: 
            linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 100%),
            radial-gradient(circle at top right, rgba(233, 30, 99, 0.1) 0%, transparent 50%);
          border-color: #E91E63;
        }

        .plan-card.weight-loss::before {
          background: linear-gradient(90deg, #E91E63, #C2185B);
        }

        .plan-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          gap: 10px;
        }

        .plan-icon {
          font-size: 24px;
        }

        .plan-card h3 {
          text-align: center;
          font-size: 20px;
          margin: 0;
          font-weight: 700;
        }

        .plan-details {
          display: grid;
          gap: 12px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: 
            rgba(255,255,255,0.8),
            radial-gradient(circle at top left, rgba(255,255,255,0.3) 0%, transparent 50%);
          border-radius: 8px;
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.9);
        }

        .detail-item .label {
          font-weight: 600;
        }

                 /* Tips Section */
         .tips-section {
           display: grid;
           gap: 20px;
           margin-top: 30px;
           margin-bottom: 40px;
         }

                 .tip-item {
           background: 
             linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%),
             radial-gradient(circle at top left, rgba(76, 175, 80, 0.03) 0%, transparent 50%);
           padding: 15px;
           border-radius: 12px;
           border-left: 4px solid #4CAF50;
           box-shadow: 
             0 2px 8px rgba(0,0,0,0.1),
             inset 0 1px 0 rgba(255,255,255,0.8);
           display: flex;
           align-items: flex-start;
           gap: 15px;
           position: relative;
           overflow: hidden;
         }

        .tip-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #4CAF50, #2E7D32);
        }

        .tip-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .tip-content h3 {
          color: #2E7D32;
          font-size: 18px;
          margin-bottom: 10px;
          font-weight: 600;
        }

        .tip-content p {
          margin: 0;
          line-height: 1.6;
        }

                 /* Sleep & Recovery */
         .sleep-section, .recovery-section {
           margin-bottom: 30px;
         }

        .sleep-section h3, .recovery-section h3 {
          color: #2E7D32;
          font-size: 22px;
          margin-bottom: 20px;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 10px;
          position: relative;
        }

        .sleep-section h3::after, .recovery-section h3::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 40px;
          height: 2px;
          background: #2E7D32;
        }

        .sleep-recommendations, .recovery-tips {
          background: 
            linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%),
            radial-gradient(circle at top left, rgba(76, 175, 80, 0.03) 0%, transparent 50%);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 
            0 2px 8px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.8);
          position: relative;
          overflow: hidden;
        }

        .sleep-recommendations::before, .recovery-tips::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #4CAF50, #2E7D32);
        }

        .sleep-recommendations p, .recovery-tips p {
          margin: 8px 0;
          padding-right: 15px;
          position: relative;
        }

        .sleep-recommendations p::before, .recovery-tips p::before {
          content: '•';
          color: #4CAF50;
          font-weight: bold;
          position: absolute;
          right: 0;
        }

                 /* Footer */
         .report-footer {
           text-align: center;
           margin-top: auto;
           padding-top: 20px;
           padding-bottom: 0;
           border-top: 2px solid #4CAF50;
           color: #666;
           font-size: 14px;
         }



        .report-footer p {
          margin: 5px 0;
        }

        /* Loading and Error States */
        .loading, .error {
          text-align: center;
          padding: 50px;
          font-size: 18px;
        }

        .error {
          color: #d32f2f;
        }

        /* Print Styles */
        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          .print-report {
            width: 100%;
            height: 100%;
          }

                     .page {
             page-break-after: always;
             page-break-inside: avoid;
             margin: 0;
             padding: 15mm;
             box-shadow: none;
             border: none;
           }

           .cover-page {
             padding: 40mm !important;
           }

          .page:last-child {
            page-break-after: auto;
          }

          .page-logo {
            top: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
          }



          /* Ensure no background colors in print */
          .result-card, .plan-card, .tip-item, .analysis-item, .need-item {
            background: white !important;
            border: 1px solid #ccc !important;
          }

          /* Hide any non-essential elements */
          .no-print {
            display: none !important;
          }

          /* Hide print button when printing */
          .print-button-container {
            display: none !important;
          }
        }

        /* Print Button Styles */
        .print-button-container {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1000;
        }

        .print-button {
          background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          transition: all 0.3s ease;
          font-family: 'Cairo', sans-serif;
        }

        .print-button:hover {
          background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
        }

        .print-button:active {
          transform: translateY(0);
        }

        /* Screen Styles */
        @media screen {
          .print-report {
            max-width: 800px;
            margin: 0 auto;
            background: #f5f5f5;
            padding: 20px;
          }

          .page {
            margin-bottom: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintReport() {
  return (
    <Suspense fallback={<div className="loading">جاري تحميل التقرير...</div>}>
      <PrintReportContent />
    </Suspense>
  );
} 