import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Upload, Shield, Lock, Cpu, FileSpreadsheet, Download, Printer, Trash2,
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Activity,
  AlertTriangle, Sparkles, RefreshCw, Search, FileDown,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  parseBankStatement, computeInsights, exportTxnsToExcel,
  type BankTxn, type BankInsights,
} from '@/lib/analytics/bankStatementParser';

const MAX_MB = 25;
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#06b6d4', '#a855f7'];

export default function AnalyticsBankStatement() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [txns, setTxns] = useState<BankTxn[]>([]);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  // Hard guarantee: clear in-memory data when the user navigates away or refreshes.
  useEffect(() => {
    const clear = () => { setTxns([]); setFile(null); };
    window.addEventListener('beforeunload', clear);
    return () => {
      window.removeEventListener('beforeunload', clear);
      clear();
    };
  }, []);

  const insights: BankInsights | null = useMemo(
    () => (txns.length ? computeInsights(txns) : null),
    [txns],
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }).format(n);

  const handleFile = async (f: File) => {
    if (f.size > MAX_MB * 1024 * 1024) {
      toast({
        title: isAr ? 'حجم الملف كبير' : 'File too large',
        description: isAr ? `الحد الأقصى ${MAX_MB} ميجابايت` : `Max ${MAX_MB} MB`,
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const result = await parseBankStatement(f);
      if (!result.txns.length) {
        toast({
          title: isAr ? 'لم يتم اكتشاف عمليات' : 'No transactions detected',
          description: isAr ? 'تأكد من وجود أعمدة التاريخ والمبلغ.' : 'Make sure the file has Date and Amount columns.',
          variant: 'destructive',
        });
        return;
      }
      setFile(f);
      setTxns(result.txns);
      toast({
        title: isAr ? 'تم التحليل محلياً' : 'Analyzed locally',
        description: `${result.txns.length} ${isAr ? 'عملية' : 'transactions'}`,
      });
      setTimeout(() => dashboardRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      toast({
        title: isAr ? 'فشل تحليل الملف' : 'Parsing failed',
        description: e?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setTxns([]); setFile(null); setSearch('');
    toast({ title: isAr ? 'تم مسح البيانات من الذاكرة' : 'Data cleared from memory' });
  };

  const onExportExcel = () => {
    if (!txns.length) return;
    exportTxnsToExcel(txns, `bank-analysis-${Date.now()}.xlsx`);
  };

  const onPrint = () => window.print();

  const onExportPdf = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, jsPDFMod] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const jsPDF = (jsPDFMod as any).jsPDF || (jsPDFMod as any).default;
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
      });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let w = pw - 16, h = w / ratio;
      if (h > ph - 16) { h = ph - 16; w = h * ratio; }
      pdf.addImage(img, 'PNG', (pw - w) / 2, 8, w, h);
      pdf.save(`bank-analysis-${Date.now()}.pdf`);
    } catch (e: any) {
      toast({ title: 'PDF failed', description: e?.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const filteredTxns = useMemo(() => {
    if (!search.trim()) return txns;
    const q = search.toLowerCase();
    return txns.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.dateStr.includes(q),
    );
  }, [txns, search]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        {/* Hero / Privacy */}
        {!txns.length && (
          <section className="relative overflow-hidden border-b">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />
            <div className="container mx-auto px-4 py-14 max-w-6xl">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="text-center space-y-4 mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold backdrop-blur">
                  <Shield className="h-3.5 w-3.5" />
                  {isAr ? '100% خاص — بياناتك لا تغادر جهازك' : '100% Private — your data never leaves your device'}
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  {isAr ? 'تحليل كشف الحساب البنكي' : 'Bank Statement Analyzer'}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {isAr
                    ? 'ارفع كشف حسابك البنكي بصيغة Excel أو CSV واحصل على لوحة تحليل احترافية فورية، تتم بالكامل داخل متصفحك بدون أي حفظ.'
                    : 'Upload your bank statement (Excel/CSV) and get an instant professional dashboard — fully processed in your browser, nothing stored.'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20 gap-1"><Lock className="h-3 w-3" />{isAr ? 'بدون رفع للسيرفر' : 'No server upload'}</Badge>
                  <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 border-sky-500/20 gap-1"><Cpu className="h-3 w-3" />{isAr ? 'معالجة محلية' : 'Local processing'}</Badge>
                  <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 border-violet-500/20 gap-1"><Trash2 className="h-3 w-3" />{isAr ? 'حذف تلقائي عند التحديث' : 'Auto-clears on refresh'}</Badge>
                </div>
              </motion.div>

              {/* Upload Zone */}
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <Card
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setDrag(false);
                    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
                  }}
                  className={`relative max-w-3xl mx-auto p-10 border-2 border-dashed transition-all backdrop-blur-xl bg-card/60 ${drag ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40'}`}
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                      <Upload className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        {isAr ? 'اسحب الملف هنا أو انقر للاختيار' : 'Drag & drop or click to choose'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isAr ? `XLSX, XLS, CSV — حتى ${MAX_MB} ميجابايت` : `XLSX, XLS, CSV — up to ${MAX_MB} MB`}
                      </p>
                    </div>
                    <input
                      ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
                    />
                    <Button size="lg" onClick={() => fileRef.current?.click()} disabled={loading}
                      className="gap-2 shadow-lg shadow-primary/20">
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                      {loading ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : (isAr ? 'اختر ملف' : 'Choose file')}
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Feature row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 max-w-4xl mx-auto">
                {[
                  { icon: Shield, t: isAr ? 'خصوصية مطلقة' : 'Absolute Privacy', d: isAr ? 'لا قواعد بيانات. لا حسابات. لا كوكيز.' : 'No DB. No accounts. No cookies.' },
                  { icon: Activity, t: isAr ? 'تحليل ذكي فوري' : 'Instant Smart Analysis', d: isAr ? 'KPIs، رسوم، تصنيف تلقائي، كشف شذوذ.' : 'KPIs, charts, auto-categorization, anomalies.' },
                  { icon: FileDown, t: isAr ? 'تصدير احترافي' : 'Professional Export', d: isAr ? 'PDF، Excel، طباعة.' : 'PDF, Excel, Print.' },
                ].map((f, i) => (
                  <Card key={i} className="p-5 backdrop-blur-md bg-card/60">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold mb-1">{f.t}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.d}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Dashboard */}
        {insights && (
          <section ref={dashboardRef} className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold truncate max-w-[280px]">{file?.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3 text-emerald-500" />
                    {isAr ? 'تم التحليل محلياً — لم يتم رفع شيء' : 'Analyzed locally — nothing uploaded'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onPrint} className="gap-1"><Printer className="h-4 w-4" />{isAr ? 'طباعة' : 'Print'}</Button>
                <Button variant="outline" size="sm" onClick={onExportExcel} className="gap-1"><Download className="h-4 w-4" />Excel</Button>
                <Button variant="outline" size="sm" onClick={onExportPdf} disabled={exporting} className="gap-1">
                  {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} PDF
                </Button>
                <Button variant="destructive" size="sm" onClick={onReset} className="gap-1"><Trash2 className="h-4 w-4" />{isAr ? 'مسح' : 'Clear'}</Button>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                icon={ArrowDownRight} color="emerald" label={isAr ? 'إجمالي الإيداعات' : 'Total Deposits'}
                value={fmt(insights.totalDeposits)}
              />
              <KpiCard
                icon={ArrowUpRight} color="rose" label={isAr ? 'إجمالي السحوبات' : 'Total Withdrawals'}
                value={fmt(insights.totalWithdrawals)}
              />
              <KpiCard
                icon={insights.netFlow >= 0 ? TrendingUp : TrendingDown}
                color={insights.netFlow >= 0 ? 'emerald' : 'rose'}
                label={isAr ? 'صافي التدفق' : 'Net Cash Flow'}
                value={fmt(insights.netFlow)}
              />
              <KpiCard
                icon={Wallet} color="sky" label={isAr ? 'الرصيد الحالي' : 'Current Balance'}
                value={insights.currentBalance != null ? fmt(insights.currentBalance) : '—'}
              />
              <KpiCard
                icon={Activity} color="violet" label={isAr ? 'عدد العمليات' : 'Transactions'}
                value={insights.txnCount.toLocaleString()}
              />
              <KpiCard
                icon={TrendingUp} color="amber" label={isAr ? 'متوسط العملية' : 'Average Txn'}
                value={fmt(insights.averageTxn)}
              />
              <KpiCard
                icon={ArrowUpRight} color="indigo" label={isAr ? 'أكبر عملية' : 'Largest Txn'}
                value={insights.largest ? fmt(Math.max(insights.largest.debit, insights.largest.credit)) : '—'}
                sub={insights.largest?.description.slice(0, 22)}
              />
              <KpiCard
                icon={AlertTriangle} color={insights.anomalies.length ? 'amber' : 'emerald'}
                label={isAr ? 'عمليات شاذة' : 'Anomalies'}
                value={insights.anomalies.length.toString()}
              />
            </div>

            {/* Alerts */}
            {insights.alerts.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-bold">{isAr ? 'رؤى ذكية' : 'AI Insights'}</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  {insights.alerts.map((a, i) => (
                    <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm border ${
                      a.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300' :
                      a.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                      'bg-sky-500/5 border-sky-500/20 text-sky-700 dark:text-sky-300'
                    }`}>
                      <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{isAr ? a.textAr : a.text}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Charts row 1 */}
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="p-5 lg:col-span-2">
                <h3 className="font-bold mb-3">{isAr ? 'تطور الرصيد' : 'Balance Trend'}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={insights.balanceTrend} margin={{ top: 10, right: 16, left: 8, bottom: 30 }}>
                    <defs>
                      <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" fontSize={11} dy={6} />
                    <YAxis width={60} fontSize={11} tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="url(#bal)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card className="p-5">
                <h3 className="font-bold mb-3">{isAr ? 'حسب التصنيف' : 'By Category'}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={insights.byCategory.slice(0, 8)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={95} paddingAngle={2}>
                      {insights.byCategory.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Charts row 2 */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="font-bold mb-3">{isAr ? 'التدفق النقدي الشهري' : 'Monthly Cash Flow'}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={insights.byMonth} margin={{ top: 10, right: 16, left: 8, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" fontSize={11} angle={-30} textAnchor="end" height={50} interval={0} />
                    <YAxis width={60} fontSize={11} tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="deposits" name={isAr ? 'إيداعات' : 'Deposits'} fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="withdrawals" name={isAr ? 'سحوبات' : 'Withdrawals'} fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card className="p-5">
                <h3 className="font-bold mb-3">{isAr ? 'النشاط حسب اليوم' : 'Activity by Weekday'}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={insights.byWeekday} margin={{ top: 10, right: 16, left: 8, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={11} dy={6} />
                    <YAxis width={60} fontSize={11} tickFormatter={(v) => v.toLocaleString()} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="deposits" name={isAr ? 'إيداعات' : 'Deposits'} stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="withdrawals" name={isAr ? 'سحوبات' : 'Withdrawals'} stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Recurring & Anomalies */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary" />{isAr ? 'عمليات متكررة' : 'Recurring Transactions'}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? 'الوصف' : 'Description'}</TableHead>
                      <TableHead className="text-end">{isAr ? 'المرات' : 'Count'}</TableHead>
                      <TableHead className="text-end">{isAr ? 'الإجمالي' : 'Total'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.recurring.length ? insights.recurring.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="max-w-[240px] truncate">{r.description}</TableCell>
                        <TableCell className="text-end">{r.count}</TableCell>
                        <TableCell className="text-end font-mono">{fmt(r.total)}</TableCell>
                      </TableRow>
                    )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">—</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>
              <Card className="p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />{isAr ? 'عمليات غير اعتيادية' : 'Unusual Transactions'}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead>{isAr ? 'الوصف' : 'Description'}</TableHead>
                      <TableHead className="text-end">{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.anomalies.length ? insights.anomalies.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.dateStr}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                        <TableCell className="text-end font-mono">{fmt(Math.max(t.debit, t.credit))}</TableCell>
                      </TableRow>
                    )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">—</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Transactions Table */}
            <Card className="p-5">
              <Tabs defaultValue="all">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <TabsList>
                    <TabsTrigger value="all">{isAr ? 'الكل' : 'All'}</TabsTrigger>
                    <TabsTrigger value="deposits">{isAr ? 'الإيداعات' : 'Deposits'}</TabsTrigger>
                    <TabsTrigger value="withdrawals">{isAr ? 'السحوبات' : 'Withdrawals'}</TabsTrigger>
                  </TabsList>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder={isAr ? 'بحث...' : 'Search...'}
                      className="ps-8 w-56"
                    />
                  </div>
                </div>
                {(['all', 'deposits', 'withdrawals'] as const).map(tab => {
                  const list = filteredTxns.filter(t =>
                    tab === 'all' ? true : tab === 'deposits' ? t.credit > 0 : t.debit > 0,
                  ).slice(0, 200);
                  return (
                    <TabsContent key={tab} value={tab}>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                              <TableHead>{isAr ? 'الوصف' : 'Description'}</TableHead>
                              <TableHead>{isAr ? 'التصنيف' : 'Category'}</TableHead>
                              <TableHead className="text-end">{isAr ? 'سحب' : 'Debit'}</TableHead>
                              <TableHead className="text-end">{isAr ? 'إيداع' : 'Credit'}</TableHead>
                              <TableHead className="text-end">{isAr ? 'الرصيد' : 'Balance'}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {list.map(t => (
                              <TableRow key={t.id}>
                                <TableCell className="whitespace-nowrap">{t.dateStr}</TableCell>
                                <TableCell className="max-w-[280px] truncate">{t.description}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{t.category}</Badge></TableCell>
                                <TableCell className="text-end font-mono text-rose-600 dark:text-rose-400">{t.debit ? fmt(t.debit) : '—'}</TableCell>
                                <TableCell className="text-end font-mono text-emerald-600 dark:text-emerald-400">{t.credit ? fmt(t.credit) : '—'}</TableCell>
                                <TableCell className="text-end font-mono">{t.balance != null ? fmt(t.balance) : '—'}</TableCell>
                              </TableRow>
                            ))}
                            {!list.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">—</TableCell></TableRow>}
                          </TableBody>
                        </Table>
                      </div>
                      {filteredTxns.filter(t => tab === 'all' ? true : tab === 'deposits' ? t.credit > 0 : t.debit > 0).length > 200 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          {isAr ? 'يتم عرض أول 200 صف فقط — صدّر إلى Excel للحصول على القائمة الكاملة.' : 'Showing first 200 rows — export to Excel for the full list.'}
                        </p>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </Card>

            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 pt-2">
              <Lock className="h-3 w-3 text-emerald-500" />
              {isAr
                ? 'كل البيانات تختفي من الذاكرة عند مغادرة الصفحة أو الضغط على "مسح".'
                : 'All data is wiped from memory when you leave the page or click "Clear".'}
            </p>
          </section>
        )}
      </div>
    </Layout>
  );
}

function KpiCard({ icon: Icon, color, label, value, sub }: {
  icon: any; color: string; label: string; value: string; sub?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  };
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-xs text-muted-foreground font-semibold leading-tight">{label}</div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color] || colorMap.sky}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-xl md:text-2xl font-extrabold tracking-tight truncate">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</div>}
    </Card>
  );
}