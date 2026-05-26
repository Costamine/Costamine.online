import { Aggregations } from './types';

export interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  titleAr: string;
  titleEn: string;
  valueAr: string;
  valueEn: string;
}

export function generateInsights(agg: Aggregations): Insight[] {
  const out: Insight[] = [];
  if (!agg.byDay.length) return out;

  const sortedDays = [...agg.byDay].sort((a, b) => b.value - a.value);
  const best = sortedDays[0];
  const worst = sortedDays[sortedDays.length - 1];

  out.push({
    type: 'positive',
    titleAr: 'أعلى يوم مبيعات',
    titleEn: 'Best Sales Day',
    valueAr: `${best.ds} — ${Math.round(best.value).toLocaleString()} ر.س`,
    valueEn: `${best.ds} — ${Math.round(best.value).toLocaleString()} SAR`,
  });

  if (worst && worst.ds !== best.ds) {
    out.push({
      type: 'negative',
      titleAr: 'أقل يوم أداءً',
      titleEn: 'Lowest Performance Day',
      valueAr: `${worst.ds} — ${Math.round(worst.value).toLocaleString()} ر.س`,
      valueEn: `${worst.ds} — ${Math.round(worst.value).toLocaleString()} SAR`,
    });
  }

  if (agg.byMonth.length >= 2) {
    const last = agg.byMonth[agg.byMonth.length - 1];
    const prev = agg.byMonth[agg.byMonth.length - 2];
    const growth = prev.value > 0 ? ((last.value - prev.value) / prev.value) * 100 : 0;
    out.push({
      type: growth >= 0 ? 'positive' : 'negative',
      titleAr: 'نمو الشهر الأخير',
      titleEn: 'Last Month Growth',
      valueAr: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      valueEn: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
    });
  }

  if (agg.byBranch[0]) {
    out.push({
      type: 'neutral',
      titleAr: 'أعلى فرع',
      titleEn: 'Top Branch',
      valueAr: `${agg.byBranch[0].name} — ${Math.round(agg.byBranch[0].value).toLocaleString()} ر.س`,
      valueEn: `${agg.byBranch[0].name} — ${Math.round(agg.byBranch[0].value).toLocaleString()} SAR`,
    });
  }

  return out;
}