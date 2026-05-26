## الهدف

إضافة صفحة داشبورد تحليلي للمبيعات في مشروع Costamine، يقرأ ملف Excel من المستخدم (نفس بنية النموذج المرجعي) ويعرض نفس الـ KPIs والرسوم والجداول الموجودة في `dashboard_cat_v2.html`، مع المحافظة على هوية المشروع (Tailwind، Cairo/Tajawal AR، Inter EN، الوضع الداكن/الفاتح، RTL/LTR).

## النموذج (Excel Schema)

أعمدة الإدخال المعتمدة (عربي أو إنجليزي):
- `التاريخ` / `Date` (نص أو تاريخ Excel)
- `صافي_الفيمة` / `Value` (رقم)
- `صافي_الكمية` / `Qty` (رقم)
- `اسم_الفرع` / `Branch` (نص)
- `اسم_الفئة` / `Category` (نص)

## الصفحات والمسارات

- مسار جديد: `/analytics` (عام، بدون تسجيل دخول مطلوب — قابل للتقييد لاحقاً).
- رابط في الـ Navbar (أيقونة BarChart3) باللغتين.
- زر "تنزيل النموذج Excel" يولّد ملف فارغ بالأعمدة الصحيحة.
- زر "تنزيل التقرير" (PDF عبر `html2canvas + jspdf` أو Excel عبر `xlsx`).

## بنية الملفات الجديدة

```
src/pages/Analytics.tsx              صفحة الواجهة (Layout + Upload + Dashboard)
src/components/analytics/
  UploadZone.tsx                     رفع/سحب الملف + تحميل النموذج + Validation
  FiltersBar.tsx                     فلاتر: التاريخ، الفرع، الفئة، اختصارات شهرية
  KpiCards.tsx                       6 بطاقات (صافي/كميات/متوسط/يومي/أعلى فئة/أعلى يوم)
  charts/DailyChart.tsx              Line — مبيعات يومية + tabs الأشهر
  charts/MonthlyChart.tsx            Bar
  charts/WeekdayChart.tsx            Bar (ترتيب أيام الأسبوع)
  charts/BranchDonut.tsx             Doughnut
  charts/TopCategoriesChart.tsx      Horizontal Bar Top 15
  charts/MonthlyByBranch.tsx         Stacked Bar (قيمة)
  charts/MonthlyQtyByBranch.tsx      Stacked Bar (كمية)
  BranchRankList.tsx                 قائمة مرتبة + ميداليات
  CategoryTable.tsx                  جدول كامل + بحث
  TopQtyCategories.tsx               Top 10 كميات
  InsightsPanel.tsx                  رؤى تلقائية
  ExportButtons.tsx                  PDF/Excel
src/lib/analytics/
  parseExcel.ts                      قراءة + تطبيع + Validation (Zod)
  transforms.ts                      تجميعات (daily/monthly/weekday/branch/category)
  insights.ts                        أعلى/أقل يوم، اتجاه النمو
  templateExport.ts                  توليد ملف نموذج فارغ
  types.ts                           Row, Aggregations, Filters
src/hooks/useAnalyticsData.ts        إدارة الحالة + useMemo للتجميعات
```

## التقنيات

- **Excel**: `xlsx` (موجود مسبقاً في `package.json`؟ سيتم تركيبه إن لم يكن).
- **Charts**: `recharts` (المستخدم بالفعل في المشروع عبر `chart.tsx`) — يحل مكان Chart.js مع ضمان دعم الثيم والـ RTL.
- **Validation**: `zod` (موجود).
- **PDF Export**: `jspdf` + `html2canvas`.
- **i18n/Theme**: استخدام `LanguageContext` + `ThemeContext` الموجودين، وخطوط Cairo/Tajawal/Inter.
- **التصميم**: Tailwind + مكونات `Card/Tabs/Button/Input/Table` من `src/components/ui` للحفاظ على هوية الموقع بدلاً من نسخ CSS الخام للملف المرجعي.

## منطق المعالجة (`parseExcel.ts` + `transforms.ts`)

1. قراءة أول Sheet عبر `XLSX.utils.sheet_to_json`.
2. تطبيع الأعمدة (دعم AR/EN)، رفض الصفوف بدون تاريخ صالح.
3. تحليل التاريخ بصيغ متعددة (`dd/mm/yyyy`, ISO, Excel serial).
4. عرض رسالة خطأ واضحة لو أعمدة مفقودة (Toast + قائمة الأعمدة الناقصة).
5. حساب التجميعات داخل `useMemo`:
   - `totalValue`, `totalQty`, `avgUnitPrice`, `dailyAvg`
   - `byDay[]`, `byMonth[]`, `byWeekday[]`
   - `byBranch[]`, `byCategory[]` (Top 15 قيمة، Top 10 كمية)
   - `monthlyByBranch[][]` (stacked)
   - `topCategory`, `topWeekday`
6. الفلاتر تطبق قبل التجميع (Branch / Category / Date Range / شهر مختار).

## الرؤى التلقائية (`insights.ts`)

- أعلى يوم مبيعات (التاريخ + القيمة).
- أقل يوم أداء.
- نسبة نمو الشهر الأخير مقارنة بالسابق.
- أعلى فرع وفئة.

## تجربة المستخدم

1. فتح `/analytics` → حالة فارغة + زرّان: "تنزيل النموذج" و"رفع الملف".
2. سحب/إفلات أو اختيار الملف → معاينة فورية للداشبورد.
3. الفلاتر تحدّث الرسوم في نفس اللحظة (client-side، `useMemo`).
4. أزرار تصدير PDF/Excel أعلى التقرير.
5. RTL/LTR وتبديل الثيم متوافقان مع باقي الموقع.

## الأمان والأداء

- معالجة Client-side بالكامل، لا ترفع البيانات لأي خادم.
- حد أقصى لحجم الملف 10MB مع رسالة خطأ.
- استخدام `useMemo` لكل التجميعات لتجنب إعادة الحساب.
- Web Worker اختيارياً لو الملف > 50K صف (مرحلة تالية).

## الخطوات التنفيذية

1. تثبيت/التحقق من dependencies: `xlsx`, `jspdf`, `html2canvas`.
2. إنشاء `src/lib/analytics/*` (types, parseExcel, transforms, insights, templateExport).
3. بناء مكونات `src/components/analytics/*` بالاعتماد على recharts و shadcn.
4. إنشاء `src/pages/Analytics.tsx` وربط المسار في `App.tsx`.
5. إضافة رابط في `Navbar.tsx` (AR/EN).
6. اختبار: ملف نموذج فارغ + بيانات تجريبية + فلاتر + تصدير PDF.

لا تغييرات في قاعدة البيانات أو Edge Functions.
