import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SmartUploadZone } from '@/components/analytics/SmartUploadZone';
import { DataProfiler } from '@/components/analytics/universal/DataProfiler';
import { DynamicKPI } from '@/components/analytics/universal/DynamicKPI';
import { InsightCards } from '@/components/analytics/universal/InsightCards';
import { SmartChartRenderer } from '@/components/analytics/universal/SmartChartRenderer';
import { readExcelFile } from '@/lib/analytics/smartParseExcel';
import { profileDataset, generateSmartInsights } from '@/lib/analytics/smartProfiler';
import { RotateCcw, Sparkles, Table as TableIcon, ChevronDown, ChevronUp } from 'lucide-react';

const MAX_SIZE = 10 * 1024 * 1024;

export default function AnalyticsExcel() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const profile = useMemo(() => profileDataset(rows), [rows]);
  const insights = useMemo(() => generateSmartInsights(rows, profile), [rows, profile]);

  const handleFile = async (file: File) => {
    if (file.size > MAX_SIZE) {
      toast({ title: 'الملف كبير جداً', description: 'الحد الأقصى 10 ميجابايت', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const sheet = await readExcelFile(file);
      if (!sheet.rows.length) {
        toast({ title: 'الملف فارغ', variant: 'destructive' });
        return;
      }
      setRows(sheet.rows);
      toast({ title: '✅ تم التحليل تلقائياً', description: `${sheet.rows.length} صف • ${sheet.headers.length} عمود` });
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setRows([]); setShowRaw(false); };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-violet-500" />
              التحليل الذكي الشامل
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              ارفع أي ملف Excel — يتم اكتشاف الأعمدة وتوليد داشبورد ديناميكي تلقائياً
            </p>
          </div>
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              ملف جديد
            </Button>
          )}
        </div>

        {!rows.length ? (
          <SmartUploadZone onFile={handleFile} loading={loading} />
        ) : (
          <div id="universal-dashboard" className="space-y-4">
            <DynamicKPI profile={profile} />
            <DataProfiler profile={profile} />
            <InsightCards insights={insights} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {profile.suggestedCharts.filter(c => c.type !== 'table').map(c => (
                <SmartChartRenderer key={c.id} rows={rows} chart={c} />
              ))}
            </div>

            {/* Raw data (fallback / preview) */}
            <Card className="p-4">
              <button
                className="w-full flex items-center justify-between text-sm font-bold"
                onClick={() => setShowRaw(s => !s)}
              >
                <span className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4" />
                  عرض البيانات الخام ({rows.length} صف)
                </span>
                {showRaw ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showRaw && <RawTable rows={rows.slice(0, 100)} />}
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

function RawTable({ rows }: { rows: Record<string, any>[] }) {
  if (!rows.length) return null;
  const headers = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto mt-3 -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground border-b">
            {headers.map(h => (
              <th key={h} className="text-start py-2 px-2 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/30">
              {headers.map(h => (
                <td key={h} className="py-2 px-2 whitespace-nowrap">{formatCell(r[h])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 100 && (
        <p className="text-[10px] text-muted-foreground mt-2 text-center">عرض أول 100 صف فقط</p>
      )}
    </div>
  );
}

function formatCell(v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}