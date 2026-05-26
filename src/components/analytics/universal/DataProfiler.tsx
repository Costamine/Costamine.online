import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Hash, Tag, ToggleLeft, FileText, HelpCircle, Layers } from 'lucide-react';
import { ColumnProfile, DatasetProfile } from '@/lib/analytics/smartProfiler';

const TYPE_META: Record<string, { label: string; color: string; Icon: any }> = {
  date: { label: 'تاريخ', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30', Icon: Calendar },
  number: { label: 'رقم', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', Icon: Hash },
  categorical: { label: 'تصنيف', color: 'bg-violet-500/10 text-violet-500 border-violet-500/30', Icon: Tag },
  text: { label: 'نص', color: 'bg-pink-500/10 text-pink-500 border-pink-500/30', Icon: FileText },
  boolean: { label: 'منطقي', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', Icon: ToggleLeft },
  mixed: { label: 'مختلط', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30', Icon: Layers },
  empty: { label: 'فارغ', color: 'bg-muted text-muted-foreground border-border', Icon: HelpCircle },
};

const ROLE_LABEL: Record<string, string> = {
  time: 'زمن',
  measure: 'مقياس',
  dimension: 'بُعد',
  identifier: 'معرف',
  flag: 'علامة',
  unknown: '—',
};

function fmt(n?: number) {
  if (n === undefined) return '—';
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n * 100) / 100 + '';
}

export function DataProfiler({ profile }: { profile: DatasetProfile }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-bold">فهم البيانات تلقائياً</h3>
        <div className="flex gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-muted">{profile.rowCount.toLocaleString()} صف</span>
          <span className="px-2 py-0.5 rounded-full bg-muted">{profile.columnCount} عمود</span>
          {profile.timeColumn && <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500">⏱ {profile.timeColumn}</span>}
        </div>
      </div>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="text-muted-foreground border-b">
              <th className="text-start py-2 px-2 font-medium">العمود</th>
              <th className="text-start py-2 px-2 font-medium">النوع</th>
              <th className="text-start py-2 px-2 font-medium">الدور</th>
              <th className="text-end py-2 px-2 font-medium">قيم فريدة</th>
              <th className="text-end py-2 px-2 font-medium">مفقودة</th>
              <th className="text-end py-2 px-2 font-medium">إحصاء</th>
            </tr>
          </thead>
          <tbody>
            {profile.columns.map((c) => {
              const meta = TYPE_META[c.type] ?? TYPE_META.empty;
              const { Icon } = meta;
              return (
                <tr key={c.name} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-2 px-2 font-semibold truncate max-w-[180px]">{c.name}</td>
                  <td className="py-2 px-2">
                    <Badge variant="outline" className={`${meta.color} text-[10px] gap-1`}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">{ROLE_LABEL[c.role]}</td>
                  <td className="py-2 px-2 text-end">{c.unique.toLocaleString()}</td>
                  <td className="py-2 px-2 text-end text-muted-foreground">{c.missing}</td>
                  <td className="py-2 px-2 text-end text-muted-foreground">{statHint(c)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function statHint(c: ColumnProfile): string {
  if (c.type === 'number') return `μ ${fmt(c.mean)} • max ${fmt(c.max)}`;
  if (c.type === 'date' && c.minDate && c.maxDate) {
    return `${c.minDate.toISOString().slice(0, 10)} → ${c.maxDate.toISOString().slice(0, 10)}`;
  }
  if (c.topValues?.length) return `الأعلى: ${c.topValues[0].value}`;
  return '—';
}