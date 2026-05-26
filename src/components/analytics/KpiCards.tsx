import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, Package, Tag, CalendarDays, Trophy, CalendarCheck } from 'lucide-react';
import { Aggregations } from '@/lib/analytics/types';

const WD_AR: Record<string, string> = {
  Sunday: 'الأحد', Monday: 'الاثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء',
  Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت',
};

function fmt(n: number) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

export function KpiCards({ agg }: { agg: Aggregations }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const items = [
    { icon: TrendingUp, color: 'text-amber-500', label: isAr ? 'صافي المبيعات' : 'Net Sales', value: fmt(agg.totalValue), unit: isAr ? 'ر.س' : 'SAR' },
    { icon: Package, color: 'text-teal-500', label: isAr ? 'إجمالي الكميات' : 'Total Qty', value: fmt(agg.totalQty), unit: isAr ? 'وحدة' : 'Units' },
    { icon: Tag, color: 'text-blue-500', label: isAr ? 'متوسط سعر الوحدة' : 'Avg Unit Price', value: fmt(agg.avgUnitPrice), unit: isAr ? 'ر.س/وحدة' : 'SAR/unit' },
    { icon: CalendarDays, color: 'text-purple-500', label: isAr ? 'متوسط يومي' : 'Daily Average', value: fmt(agg.dailyAvg), unit: isAr ? `ر.س × ${agg.daysCount} يوم` : `SAR × ${agg.daysCount} days` },
    { icon: Trophy, color: 'text-green-500', label: isAr ? 'أعلى فئة' : 'Top Category', value: agg.topCategory?.name ?? '—', unit: agg.topCategory ? fmt(agg.topCategory.value) + (isAr ? ' ر.س' : ' SAR') : '' },
    { icon: CalendarCheck, color: 'text-orange-500', label: isAr ? 'أعلى يوم بالأسبوع' : 'Best Weekday', value: agg.topWeekday ? (isAr ? WD_AR[agg.topWeekday.name] : agg.topWeekday.name) : '—', unit: agg.topWeekday ? fmt(agg.topWeekday.value) + (isAr ? ' ر.س' : ' SAR') : '' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <Card
            key={i}
            className="p-4 relative overflow-hidden hover:shadow-lg transition-shadow border border-border/60 bg-card/60 backdrop-blur-sm flex flex-col min-h-[112px]"
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className={`inline-flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 ${it.color} shrink-0`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="text-[10px] text-muted-foreground font-medium text-end leading-tight line-clamp-2 flex-1">
                {it.label}
              </div>
            </div>
            <div className="mt-auto min-w-0">
              <div
                className="text-lg font-extrabold leading-tight tracking-tight truncate"
                title={String(it.value)}
                dir="ltr"
                style={{ textAlign: isAr ? 'right' : 'left' }}
              >
                {it.value}
              </div>
              {it.unit && (
                <div className="text-[10px] text-muted-foreground truncate mt-0.5" title={it.unit}>
                  {it.unit}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}