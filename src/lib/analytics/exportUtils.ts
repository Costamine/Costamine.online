import * as XLSX from 'xlsx';
import { TEMPLATE_HEADERS_AR } from './types';
import { Aggregations } from './types';

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const branches = ['الفرع الرئيسي', 'فرع الشمال', 'فرع الجنوب'];
  const categories = ['مأكولات', 'مشروبات', 'حلويات', 'وجبات سريعة'];
  const years = [2023, 2024, 2025];
  const rows: any[][] = [TEMPLATE_HEADERS_AR];
  // Generate ~3 years of monthly sample data with growth trend
  let seed = 1;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  years.forEach((y, yi) => {
    for (let m = 1; m <= 12; m++) {
      // 4 sample days per month
      [3, 10, 18, 25].forEach((d) => {
        branches.forEach((br, bi) => {
          categories.forEach((cat, ci) => {
            const base = 800 + bi * 250 + ci * 180;
            const growth = 1 + yi * 0.18; // ~18% YoY growth
            const seasonal = 1 + Math.sin((m / 12) * Math.PI * 2) * 0.25;
            const noise = 0.7 + rand() * 0.6;
            const value = Math.round(base * growth * seasonal * noise);
            const qty = Math.max(1, Math.round(value / (90 + ci * 30)));
            const ds = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            rows.push([ds, value, qty, br, cat]);
          });
        });
      });
    }
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = TEMPLATE_HEADERS_AR.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Sales');

  // Instructions sheet
  const guide = [
    ['نموذج بيانات المبيعات — Sales Data Template'],
    [],
    ['الأعمدة المطلوبة:'],
    ['التاريخ', 'تنسيق YYYY-MM-DD أو تاريخ Excel'],
    ['صافي_الفيمة', 'القيمة النقدية للمبيعات (رقم)'],
    ['صافي_الكمية', 'عدد الوحدات المباعة (رقم)'],
    ['اسم_الفرع', 'اسم الفرع أو المتجر (نص)'],
    ['اسم_الفئة', 'فئة المنتج (نص)'],
    [],
    ['ملاحظات:'],
    ['• يدعم النموذج بيانات متعددة السنوات لحساب النمو السنوي (YoY).'],
    ['• كل صف يمثل عملية بيع/إجمالي يومي لفئة وفرع معين.'],
    ['• احذف بيانات النموذج وأضف بياناتك مع الحفاظ على الأعمدة.'],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guide);
  wsGuide['!cols'] = [{ wch: 22 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'تعليمات');

  XLSX.writeFile(wb, 'sales_template.xlsx');
}

export function exportAggregationsToExcel(agg: Aggregations) {
  const wb = XLSX.utils.book_new();

  const summary = [
    ['Metric', 'Value'],
    ['Total Sales', agg.totalValue],
    ['Total Qty', agg.totalQty],
    ['Avg Unit Price', agg.avgUnitPrice],
    ['Daily Average', agg.dailyAvg],
    ['Days Count', agg.daysCount],
    ['Top Category', agg.topCategory?.name ?? ''],
    ['Top Weekday', agg.topWeekday?.name ?? ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(agg.byDay), 'Daily');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(agg.byMonth), 'Monthly');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(agg.byBranch), 'Branches');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(agg.byCategory), 'Categories');

  XLSX.writeFile(wb, `sales_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportDashboardToPDF(elementId: string) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const el = document.getElementById(elementId);
  if (!el) return;

  // Resolve background color (avoid transparent → black artifacts)
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const bg = !bodyBg || bodyBg === 'rgba(0, 0, 0, 0)' ? '#ffffff' : bodyBg;

  // Pre-size chart containers so axis labels are not clipped in PDF
  const chartSizes: Record<string, { w: number; h: number }> = {
    'daily-chart':    { w: 1100, h: 280 },
    'monthly-chart':  { w: 350,  h: 220 },
    'weekday-chart':  { w: 350,  h: 220 },
    'branch-chart':   { w: 350,  h: 240 },
    'topcat-chart':   { w: 700,  h: 360 },
    'monthbr-chart':  { w: 540,  h: 280 },
    'monthbrq-chart': { w: 540,  h: 280 },
    'growth-chart':   { w: 1100, h: 280 },
  };
  const restored: Array<() => void> = [];
  Object.entries(chartSizes).forEach(([id, s]) => {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    const rc = wrap.querySelector('.recharts-responsive-container') as HTMLElement | null;
    if (!rc) return;
    const ow = rc.style.width, oh = rc.style.height;
    rc.style.width = `${s.w}px`;
    rc.style.height = `${s.h}px`;
    restored.push(() => { rc.style.width = ow; rc.style.height = oh; });
  });

  // Allow recharts ResponsiveContainer to react to size change
  await new Promise(r => setTimeout(r, 350));

  const fullCanvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: bg,
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth,
  });

  restored.forEach(fn => fn());

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;

  // Pixels of source canvas per page (preserve aspect ratio)
  const pxPerPt = fullCanvas.width / contentW;
  const pageSlicePx = Math.floor(contentH * pxPerPt);

  let renderedPx = 0;
  let pageIndex = 0;

  while (renderedPx < fullCanvas.height) {
    const sliceHeightPx = Math.min(pageSlicePx, fullCanvas.height - renderedPx);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = fullCanvas.width;
    sliceCanvas.height = sliceHeightPx;
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      fullCanvas,
      0, renderedPx, fullCanvas.width, sliceHeightPx,
      0, 0, fullCanvas.width, sliceHeightPx,
    );
    const sliceData = sliceCanvas.toDataURL('image/png');
    const sliceHeightPt = sliceHeightPx / pxPerPt;
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(sliceData, 'PNG', margin, margin, contentW, sliceHeightPt, undefined, 'FAST');
    renderedPx += sliceHeightPx;
    pageIndex++;
  }

  pdf.save(`sales_report_${new Date().toISOString().slice(0, 10)}.pdf`);
}