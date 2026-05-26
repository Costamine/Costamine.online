import { Card } from '@/components/ui/card';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Aggregations } from '@/lib/analytics/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMemo, useState } from 'react';

const COLORS = ['#f5c518', '#00bfa5', '#3b82f6', '#a855f7', '#22c55e', '#fb923c', '#22d3ee', '#fb7185', '#84cc16', '#e879f9', '#38bdf8', '#fbbf24'];
const MONTH_AR: Record<number, string> = { 1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل', 5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس', 9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر' };
const MONTH_EN: Record<number, string> = { 1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec' };
const WD_AR: Record<string, string> = { Sunday: 'الأحد', Monday: 'الاثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت' };

function formatCompact(n: number, isAr: boolean): string {
  const abs = Math.abs(n);
  const k = isAr ? ' ألف' : 'K';
  const m = isAr ? ' م' : 'M';
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + m;
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + k;
  return Math.round(n).toLocaleString();
}

// Unified professional tooltip — subtle glassy card, theme-aware colors via CSS vars
function ProTooltip({ active, payload, label, isAr, unit, accent }: any) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p: any) => p && p.value != null);
  if (!items.length) return null;
  const u = unit ?? (isAr ? 'ر.س' : 'SAR');
  return (
    <div
      className="pointer-events-none rounded-lg px-3 py-2 text-xs"
      style={{
        background: 'hsl(var(--popover) / 0.92)',
        color: 'hsl(var(--popover-foreground))',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 8px 24px -8px hsl(var(--background) / 0.6), 0 0 0 1px hsl(var(--border) / 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minWidth: 110,
      }}
    >
      {label != null && (
        <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600, marginBottom: 4, letterSpacing: 0.3 }}>
          {label}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((p: any, i: number) => {
          const color = items.length === 1 ? (accent || p.color || '#f5c518') : (p.color || p.payload?.fill || accent);
          return (
            <div key={i} className="flex items-center gap-2 font-bold">
              <span style={{ width: 7, height: 7, borderRadius: 999, background: color, boxShadow: `0 0 6px ${color}` }} />
              {items.length > 1 && (
                <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>{p.name}</span>
              )}
              <span style={{ color, marginInlineStart: 'auto' }}>
                {Math.round(p.value).toLocaleString()} <span style={{ opacity: 0.7, fontWeight: 600, fontSize: 10 }}>{u}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const sharedTooltipProps = (isAr: boolean, opts: { accent?: string; unit?: string; cursorType?: 'line' | 'bar' } = {}) => {
  const accent = opts.accent ?? '#f5c518';
  const cursor = opts.cursorType === 'bar'
    ? { fill: accent, fillOpacity: 0.08, radius: 6 }
    : { stroke: accent, strokeWidth: 1, strokeDasharray: '4 4', fill: 'none' as const };
  return {
    cursor,
    wrapperStyle: { outline: 'none' },
    isAnimationActive: false,
    content: (p: any) => <ProTooltip {...p} isAr={isAr} unit={opts.unit} accent={accent} />,
  };
};

function ChartCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">{badge}</span>}
      </div>
      {children}
    </Card>
  );
}

export function ChartsGrid({ agg }: { agg: Aggregations }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const ML = isAr ? MONTH_AR : MONTH_EN;
  const [dailyMonth, setDailyMonth] = useState<number | 'all'>('all');

  const availableMonths = useMemo(() => {
    const s = new Set<number>();
    agg.byDay.forEach(d => s.add(parseInt(d.ds.slice(5, 7), 10)));
    return Array.from(s).sort((a, b) => a - b);
  }, [agg.byDay]);

  const dailyData = useMemo(() => {
    const src = dailyMonth === 'all'
      ? agg.byDay
      : agg.byDay.filter(d => parseInt(d.ds.slice(5, 7), 10) === dailyMonth);
    return src.map(d => ({ name: d.ds.slice(5).replace('-', '/'), value: Math.round(d.value) }));
  }, [agg.byDay, dailyMonth]);

  const monthlyData = agg.byMonth.map(m => ({ name: ML[m.month], value: Math.round(m.value) }));
  const weekdayData = agg.byWeekday.map(w => ({ name: isAr ? WD_AR[w.name] : w.name.slice(0, 3), value: Math.round(w.value) }));
  const branchData = agg.byBranch.map(b => ({ name: b.name, value: Math.round(b.value) }));
  const topCatData = agg.byCategory.slice(0, 15).map(c => ({ name: c.name, value: Math.round(c.value) }));
  const monthlyByBranch = agg.monthlyByBranch.map(r => ({ ...r, name: ML[r.month as number] }));

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#f5c518', boxShadow: '0 0 8px #f5c518' }} />
            <h3 className="text-sm font-bold">{isAr ? 'المبيعات اليومية' : 'Daily Sales'}</h3>
          </div>
          {availableMonths.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {availableMonths.map(m => (
                <button
                  key={m}
                  onClick={() => setDailyMonth(m)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    dailyMonth === m
                      ? 'bg-[#f5c518] text-[#07111e] border-[#f5c518] shadow-[0_2px_10px_rgba(245,197,24,0.3)]'
                      : 'bg-muted/40 text-muted-foreground border-border hover:border-[#f5c518] hover:text-[#f5c518]'
                  }`}
                >{ML[m]}</button>
              ))}
              <button
                onClick={() => setDailyMonth('all')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  dailyMonth === 'all'
                    ? 'bg-[#f5c518] text-[#07111e] border-[#f5c518] shadow-[0_2px_10px_rgba(245,197,24,0.3)]'
                    : 'bg-muted/40 text-muted-foreground border-border hover:border-[#f5c518] hover:text-[#f5c518]'
                }`}
              >{isAr ? 'الكل' : 'All'}</button>
            </div>
          )}
        </div>
        <div id="daily-chart" className="daily-chart">
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={dailyData} margin={{ top: 10, right: 15, left: 10, bottom: 35 }}>
            <defs>
              <linearGradient id="dailyGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5c518" stopOpacity={0.45} />
                <stop offset="60%" stopColor="#f5c518" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#f5c518" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
            <XAxis
              dataKey="name"
              fontSize={10}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              minTickGap={20}
              dy={10}
            />
            <YAxis
              fontSize={10}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompact(v, isAr)}
              width={55}
            />
            <Tooltip
              {...sharedTooltipProps(isAr, { accent: '#f5c518' })}
              wrapperStyle={{ outline: 'none', overflow: 'visible' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#f5c518"
              strokeWidth={2.5}
              fill="url(#dailyGold)"
              activeDot={{ r: 4, fill: '#f5c518', stroke: 'transparent', strokeWidth: 0 }}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title={isAr ? 'المبيعات الشهرية' : 'Monthly Sales'} badge={isAr ? 'شهري' : 'Monthly'}>
          <div id="monthly-chart" className="monthly-chart w-full">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 16, left: 8, bottom: 40 }} barCategoryGap="20%">
              <defs>
                <linearGradient id="grdTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d9b8" stopOpacity={1} />
                  <stop offset="100%" stopColor="#00bfa5" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
              <XAxis dataKey="name" fontSize={9} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v, isAr)} width={52} />
              <Tooltip {...sharedTooltipProps(isAr, { accent: '#00bfa5', cursorType: 'bar' })} />
              <Bar dataKey="value" fill="url(#grdTeal)" radius={[6, 6, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={isAr ? 'حسب اليوم' : 'By Weekday'} badge={isAr ? 'أسبوعي' : 'Weekly'}>
          <div id="weekday-chart" className="weekday-chart w-full">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekdayData} margin={{ top: 10, right: 16, left: 8, bottom: 28 }} barCategoryGap="20%">
              <defs>
                <linearGradient id="grdBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
              <XAxis dataKey="name" fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={8} interval={0} />
              <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v, isAr)} width={52} />
              <Tooltip {...sharedTooltipProps(isAr, { accent: '#3b82f6', cursorType: 'bar' })} />
              <Bar dataKey="value" fill="url(#grdBlue)" radius={[6, 6, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={isAr ? 'توزيع الفروع' : 'Branch Distribution'} badge="Donut">
          <div id="branch-chart" className="donut-chart w-full">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={branchData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={92}
                paddingAngle={3}
                stroke="hsl(var(--card))"
                strokeWidth={2}
                animationDuration={800}
              >
                {branchData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...sharedTooltipProps(isAr)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={isAr ? 'أعلى 15 فئة' : 'Top 15 Categories'} badge="Top 15">
          <div id="topcat-chart" className="top-cat-chart">
          <ResponsiveContainer width="100%" height={Math.max(320, topCatData.length * 24)}>
            <BarChart data={topCatData} layout="vertical" margin={{ left: 95, right: 20, top: 4, bottom: 30 }}>
              <defs>
                <linearGradient id="grdGreen" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} opacity={0.4} />
              <XAxis type="number" fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v, isAr)} dy={8} />
              <YAxis type="category" dataKey="name" fontSize={10} stroke="hsl(var(--muted-foreground))" width={85} tickLine={false} axisLine={false} />
              <Tooltip {...sharedTooltipProps(isAr, { accent: '#22c55e', cursorType: 'bar' })} />
              <Bar dataKey="value" fill="url(#grdGreen)" radius={[0, 4, 4, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={isAr ? 'ترتيب الفروع' : 'Branch Ranking'} badge={isAr ? 'بالقيمة' : 'By Value'}>
          <div className="space-y-2 py-2">
            {agg.byBranch.map((b, i) => {
              const max = agg.byBranch[0]?.value || 1;
              const pct = (b.value / max) * 100;
              const medal = ['🥇', '🥈', '🥉'][i];
              return (
                <div key={b.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{medal || `#${i + 1}`} {b.name}</span>
                    <span className="text-muted-foreground">{Math.round(b.value).toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {agg.branches.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title={isAr ? 'المبيعات الشهرية حسب الفرع' : 'Monthly Sales by Branch'} badge="Stacked">
            <div id="monthbr-chart">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={monthlyByBranch} margin={{ top: 8, right: 12, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                <XAxis dataKey="name" fontSize={9} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={45} />
                <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v, isAr)} width={48} />
                <Tooltip {...sharedTooltipProps(isAr, { cursorType: 'bar' })} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {agg.branches.map((b, i) => (
                  <Bar key={b} dataKey={b} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === agg.branches.length - 1 ? [6, 6, 0, 0] : 0} animationDuration={800} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title={isAr ? 'الكميات الشهرية حسب الفرع' : 'Monthly Qty by Branch'} badge={isAr ? 'كميات' : 'Qty'}>
            <div id="monthbrq-chart">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={agg.monthlyQtyByBranch.map(r => ({ ...r, name: ML[r.month as number] }))} margin={{ top: 8, right: 12, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                <XAxis dataKey="name" fontSize={9} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={45} />
                <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v, isAr)} width={48} />
                <Tooltip {...sharedTooltipProps(isAr, { unit: isAr ? 'وحدة' : 'units', cursorType: 'bar' })} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {agg.branches.map((b, i) => (
                  <Bar key={b} dataKey={b} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === agg.branches.length - 1 ? [6, 6, 0, 0] : 0} animationDuration={800} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
}