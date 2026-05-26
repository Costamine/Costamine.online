import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SuggestedChart, toNumber, toDate } from '@/lib/analytics/smartProfiler';

interface Props {
  rows: Record<string, any>[];
  chart: SuggestedChart;
}

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16'];

const tooltipStyle = {
  background: 'hsl(var(--popover) / 0.95)',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  backdropFilter: 'blur(10px)',
  color: 'hsl(var(--popover-foreground))',
};

function fmtCompact(n: number) {
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

export function SmartChartRenderer({ rows, chart }: Props) {
  const data = useMemo(() => buildData(rows, chart), [rows, chart]);

  return (
    <Card className="p-4 h-full">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <h3 className="text-sm font-bold">{chart.title}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">{chart.reason}</p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">{chart.type}</Badge>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">{renderChart(chart.type, data)}</ResponsiveContainer>
      </div>
    </Card>
  );
}

function renderChart(type: SuggestedChart['type'], data: any[]): React.ReactElement {
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
        لا توجد بيانات كافية
      </div>
    ) as any;
  }

  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
      <XAxis dataKey="name" fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
      <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={fmtCompact} width={50} />
      <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} contentStyle={tooltipStyle} formatter={(v: any) => fmtCompact(+v)} />
    </>
  );

  switch (type) {
    case 'line':
      return (
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          {common}
          <Line type="monotone" dataKey="value" stroke={PALETTE[0]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={700} />
        </LineChart>
      );
    case 'area':
      return (
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sg-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PALETTE[0]} stopOpacity={0.5} />
              <stop offset="100%" stopColor={PALETTE[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          {common}
          <Area type="monotone" dataKey="value" stroke={PALETTE[0]} fill="url(#sg-area)" strokeWidth={2} />
        </AreaChart>
      );
    case 'bar':
    case 'histogram':
      return (
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          {common}
          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={700}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Bar>
        </BarChart>
      );
    case 'pie':
      return (
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtCompact(+v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
        </PieChart>
      );
    default:
      return <div /> as any;
  }
}

function buildData(rows: Record<string, any>[], chart: SuggestedChart): { name: string; value: number }[] {
  const { type, x, y } = chart;

  if (type === 'line' || type === 'area') {
    if (!y) return [];
    const map = new Map<string, number>();
    rows.forEach(r => {
      const d = toDate(r[x]);
      const v = toNumber(r[y]);
      if (!d || v === null) return;
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + v);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({ name, value }));
  }

  if (type === 'bar') {
    if (!y) return [];
    const map = new Map<string, number>();
    rows.forEach(r => {
      const k = String(r[x] ?? '—');
      const v = toNumber(r[y]);
      if (v === null) return;
      map.set(k, (map.get(k) ?? 0) + v);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, value]) => ({ name, value }));
  }

  if (type === 'pie') {
    const map = new Map<string, number>();
    rows.forEach(r => {
      const k = String(r[x] ?? '—');
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }

  if (type === 'histogram') {
    const nums = rows.map(r => toNumber(r[x])).filter((n): n is number => n !== null);
    if (!nums.length) return [];
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const bins = Math.min(10, Math.max(5, Math.round(Math.sqrt(nums.length))));
    const step = (max - min) / bins || 1;
    const buckets = Array.from({ length: bins }, (_, i) => ({
      name: `${fmtCompact(min + i * step)}–${fmtCompact(min + (i + 1) * step)}`,
      value: 0,
    }));
    nums.forEach(n => {
      const idx = Math.min(bins - 1, Math.floor((n - min) / step));
      buckets[idx].value++;
    });
    return buckets;
  }

  return [];
}