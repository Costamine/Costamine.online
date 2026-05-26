import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { UploadZone } from '@/components/analytics/UploadZone';
import { FiltersBar } from '@/components/analytics/FiltersBar';
import { KpiCards } from '@/components/analytics/KpiCards';
import { ChartsGrid } from '@/components/analytics/Charts';
import { CategoryTable } from '@/components/analytics/CategoryTable';
import { InsightsPanel } from '@/components/analytics/InsightsPanel';
import { applyFilters, computeAggregations } from '@/lib/analytics/transforms';
import { generateInsights } from '@/lib/analytics/insights';
import { parseExcelFile } from '@/lib/analytics/parseExcel';
import { exportAggregationsToExcel, exportDashboardToPDF, downloadTemplate } from '@/lib/analytics/exportUtils';
import { computeYearlyGrowth } from '@/lib/analytics/googleSheets';
import { SalesRow, Filters } from '@/lib/analytics/types';
import { TrendingUp, TrendingDown, FileDown, FileText, RotateCcw, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const MAX_SIZE = 15 * 1024 * 1024;

function fmtCompact(n: number, isAr: boolean) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + (isAr ? ' م' : 'M');
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + (isAr ? ' ألف' : 'K');
  return Math.round(n).toLocaleString();
}

export default function AnalyticsLive() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [rows, setRows] = useState<SalesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({ from: null, to: null, branch: 'all', category: 'all', monthTab: 'all' });

  const handleFile = async (file: File) => {
    if (file.size > MAX_SIZE) {
      toast({ title: isAr ? 'الملف كبير جداً' : 'File too large', description: isAr ? 'الحد الأقصى 15 ميجابايت' : 'Max 15 MB', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await parseExcelFile(file);
      if (result.errors.length || !result.rows.length) {
        toast({ title: isAr ? 'خطأ في الملف' : 'File error', description: result.errors.join(' • '), variant: 'destructive' });
        return;
      }
      setRows(result.rows);
      setFilters({ from: null, to: null, branch: 'all', category: 'all', monthTab: 'all' });
      toast({ title: isAr ? '✅ تم التحليل' : '✅ Analyzed', description: `${result.validRows} ${isAr ? 'صف' : 'rows'}` });
    } catch (e: any) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const agg = useMemo(() => computeAggregations(filtered), [filtered]);
  const insights = useMemo(() => generateInsights(agg), [agg]);
  const yearly = useMemo(() => computeYearlyGrowth(filtered), [filtered]);

  const allBranches = useMemo(() => Array.from(new Set(rows.map(r => r.branch))).sort(), [rows]);
  const allCategories = useMemo(() => Array.from(new Set(rows.map(r => r.category))).sort(), [rows]);
  const allMonths = useMemo(() => Array.from(new Set(rows.map(r => r.month))).sort((a, b) => a - b), [rows]);
  const year = rows[0]?.year ?? new Date().getFullYear();

  const reset = () => { setRows([]); setFilters({ from: null, to: null, branch: 'all', category: 'all', monthTab: 'all' }); };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-accent" />
              {isAr ? 'داشبورد تحليل المبيعات' : 'Sales Analytics Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? 'ارفع ملف Excel لعرض تحليل النمو السنوي ومقارنة الفروع' : 'Upload an Excel file to view YoY growth and branch comparison'}
            </p>
          </div>
          {rows.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => exportAggregationsToExcel(agg)}>
                <FileDown className="h-4 w-4" />
                {isAr ? 'تصدير Excel' : 'Export Excel'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportDashboardToPDF('live-dashboard')}>
                <FileText className="h-4 w-4" />
                {isAr ? 'تصدير PDF' : 'Export PDF'}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <FileDown className="h-4 w-4" />
                {isAr ? 'النموذج' : 'Template'}
              </Button>
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                {isAr ? 'ملف جديد' : 'New File'}
              </Button>
            </div>
          )}
        </div>

        {!rows.length ? (
          <UploadZone onFile={handleFile} loading={loading} />
        ) : (
          <div id="live-dashboard" className="space-y-4">
            <FiltersBar
              filters={filters}
              setFilters={setFilters}
              branches={allBranches}
              categories={allCategories}
              months={allMonths}
              year={year}
            />
            <KpiCards agg={agg} />
            <InsightsPanel insights={insights} />
            <ChartsGrid agg={agg} />

            {/* YoY Growth */}
            {yearly.length >= 2 && <GrowthSection yearly={yearly} isAr={isAr} />}

            <CategoryTable agg={agg} />
          </div>
        )}
      </div>
    </Layout>
  );
}

/* ────────── Growth Section ────────── */
function GrowthSection({ yearly, isAr }: { yearly: ReturnType<typeof computeYearlyGrowth>; isAr: boolean }) {
  const data = yearly.map(y => ({
    name: String(y.year),
    growth: y.growthPct ?? 0,
    sales: y.value,
  }));

  return (
    <div className="space-y-4 growth-section">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 8px #10b981' }} />
            <h3 className="text-sm font-bold">{isAr ? 'تحليل النمو السنوي' : 'Yearly Growth Analysis'}</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">YoY</span>
        </div>
        <div id="growth-chart" className="growth-chart">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 35 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
            <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} dy={10} />
            <YAxis yAxisId="left" fontSize={10} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={48} />
            <YAxis yAxisId="right" orientation="right" fontSize={10} stroke="#f5c518" tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v, isAr)} width={55} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              wrapperStyle={{ outline: 'none' }}
              contentStyle={{
                background: 'hsl(var(--popover) / 0.92)',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
                backdropFilter: 'blur(10px)',
              }}
              formatter={(v: any, n: any) => [
                n === 'growth' ? `${(+v).toFixed(1)}%` : `${Math.round(+v).toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}`,
                n === 'growth' ? (isAr ? 'النمو' : 'Growth') : (isAr ? 'المبيعات' : 'Sales'),
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="growth" name={isAr ? 'النمو %' : 'Growth %'} radius={[6, 6, 0, 0]} animationDuration={800}>
              {data.map((d, i) => <Cell key={i} fill={d.growth >= 0 ? '#22c55e' : '#f43f5e'} />)}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="sales" name={isAr ? 'المبيعات' : 'Sales'} stroke="#f5c518" strokeWidth={2.5} dot={{ r: 4, fill: '#f5c518' }} />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 overflow-x-auto">
        <h3 className="text-sm font-bold mb-3">{isAr ? 'مقارنة سنوية تفصيلية' : 'Yearly Comparison'}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? 'السنة' : 'Year'}</TableHead>
              <TableHead className="text-end">{isAr ? 'المبيعات' : 'Sales'}</TableHead>
              <TableHead className="text-end">{isAr ? 'الفواتير' : 'Invoices'}</TableHead>
              <TableHead className="text-end">{isAr ? 'متوسط الفاتورة' : 'Avg Invoice'}</TableHead>
              <TableHead className="text-end">{isAr ? 'النمو %' : 'Growth %'}</TableHead>
              <TableHead className="text-end">{isAr ? 'الفارق' : 'Delta'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {yearly.map(y => {
              const up = (y.growthPct ?? 0) >= 0;
              const sar = isAr ? 'ر.س' : 'SAR';
              return (
                <TableRow key={y.year}>
                  <TableCell className="font-bold">{y.year}</TableCell>
                  <TableCell className="text-end font-semibold">{Math.round(y.value).toLocaleString()} <span className="text-muted-foreground text-xs">{sar}</span></TableCell>
                  <TableCell className="text-end">{y.invoices.toLocaleString()}</TableCell>
                  <TableCell className="text-end">{Math.round(y.avgInvoice).toLocaleString()} <span className="text-muted-foreground text-xs">{sar}</span></TableCell>
                  <TableCell className="text-end">
                    {y.growthPct == null ? '—' : (
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-xs ${up ? 'bg-emerald-500/10 text-emerald-600 growth-up' : 'bg-rose-500/10 text-rose-600 growth-down'}`}>
                        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {up ? '+' : ''}{y.growthPct.toFixed(1)}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={`text-end font-semibold ${y.delta == null ? '' : y.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {y.delta == null ? '—' : `${y.delta >= 0 ? '+' : ''}${Math.round(y.delta).toLocaleString()} ${sar}`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}