import { Card } from '@/components/ui/card';
import { Database, Hash, Calculator, Layers, Calendar, TrendingUp } from 'lucide-react';
import { DatasetProfile } from '@/lib/analytics/smartProfiler';

function fmt(n: number) {
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

interface KPI {
  label: string;
  value: string;
  hint?: string;
  icon: any;
  color: string;
}

export function DynamicKPI({ profile }: { profile: DatasetProfile }) {
  const kpis: KPI[] = [];

  kpis.push({
    label: 'إجمالي الصفوف',
    value: profile.rowCount.toLocaleString(),
    hint: `${profile.columnCount} عمود`,
    icon: Database,
    color: 'text-violet-500 bg-violet-500/10',
  });

  // Top measure totals
  const measureCols = profile.columns.filter(c => c.role === 'measure' && c.sum !== undefined).slice(0, 2);
  measureCols.forEach((m, i) => {
    kpis.push({
      label: `إجمالي ${m.name}`,
      value: fmt(m.sum!),
      hint: `متوسط ${fmt(m.mean!)}`,
      icon: i === 0 ? Calculator : TrendingUp,
      color: i === 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10',
    });
  });

  // Unique categories
  const dim = profile.columns.find(c => c.role === 'dimension');
  if (dim) {
    kpis.push({
      label: `عدد ${dim.name}`,
      value: dim.unique.toLocaleString(),
      hint: 'قيم فريدة',
      icon: Layers,
      color: 'text-pink-500 bg-pink-500/10',
    });
  }

  // Time range
  const time = profile.columns.find(c => c.role === 'time');
  if (time?.minDate && time.maxDate) {
    const days = Math.max(1, Math.round((+time.maxDate - +time.minDate) / 86400000));
    kpis.push({
      label: 'النطاق الزمني',
      value: `${days} يوم`,
      hint: `${time.minDate.toISOString().slice(0, 10)} → ${time.maxDate.toISOString().slice(0, 10)}`,
      icon: Calendar,
      color: 'text-cyan-500 bg-cyan-500/10',
    });
  } else if (!time) {
    kpis.push({
      label: 'الأعمدة الرقمية',
      value: profile.measures.length.toString(),
      hint: 'مقاييس قابلة للحساب',
      icon: Hash,
      color: 'text-cyan-500 bg-cyan-500/10',
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {kpis.map(k => {
        const Icon = k.icon;
        return (
          <Card key={k.label} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground font-medium truncate">{k.label}</p>
                <p className="text-xl font-extrabold mt-1 truncate">{k.value}</p>
                {k.hint && <p className="text-[10px] text-muted-foreground mt-1 truncate">{k.hint}</p>}
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${k.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}