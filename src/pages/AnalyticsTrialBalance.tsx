import { useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Scale, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseTrialBalance, buildStatements, TBRow, AccountType } from '@/lib/analytics/trialBalance';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const MAX_MB = 10;
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsTrialBalance() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === 'ar';
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<TBRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const stmts = useMemo(() => (rows.length ? buildStatements(rows) : null), [rows]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }).format(n);

  const handleFile = async (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ title: isAr ? 'حجم الملف كبير' : 'File too large', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { rows: r, errors } = await parseTrialBalance(file);
      if (errors.length) {
        toast({ title: isAr ? 'خطأ' : 'Error', description: errors.join(', '), variant: 'destructive' });
      }
      setRows(r);
      setFileName(file.name);
      if (r.length) toast({ title: isAr ? 'تم التحليل' : 'Analyzed', description: `${r.length} ${isAr ? 'حساب' : 'accounts'}` });
    } catch (e: any) {
      toast({ title: isAr ? 'فشل القراءة' : 'Read failed', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = (t: AccountType) => {
    const m: Record<AccountType, [string, string]> = {
      asset: ['الأصول', 'Assets'],
      liability: ['الخصوم', 'Liabilities'],
      equity: ['حقوق الملكية', 'Equity'],
      revenue: ['الإيرادات', 'Revenue'],
      expense: ['المصروفات', 'Expenses'],
    };
    return isAr ? m[t][0] : m[t][1];
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Scale className="h-3.5 w-3.5" />
            {isAr ? 'القوائم المالية' : 'Financial Statements'}
          </div>
          <h1 className="text-3xl font-extrabold">
            {isAr ? 'ميزان المراجعة → القوائم المالية' : 'Trial Balance → Financial Statements'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'ارفع ميزان مراجعة (الحساب، مدين، دائن) واحصل على قائمة الدخل والميزانية تلقائياً.'
              : 'Upload a trial balance (Account, Debit, Credit) and get Income Statement & Balance Sheet automatically.'}
          </p>
        </div>

        <Card
          className={`p-8 border-2 border-dashed transition-colors ${drag ? 'bg-accent/10 border-accent' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-bold mb-1">{isAr ? 'ارفع ملف ميزان المراجعة' : 'Upload Trial Balance'}</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {isAr ? 'الأعمدة المطلوبة: الحساب / مدين / دائن' : 'Required columns: Account / Debit / Credit'}
            </p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
            <Button onClick={() => inputRef.current?.click()} disabled={loading}>
              <FileSpreadsheet className="h-4 w-4" />
              {loading ? (isAr ? 'جاري...' : 'Reading...') : (isAr ? 'اختر ملف' : 'Choose File')}
            </Button>
            {fileName && <p className="text-xs text-muted-foreground mt-3">{fileName}</p>}
          </div>
        </Card>

        {stmts && (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">{isAr ? 'إجمالي مدين' : 'Total Debit'}</div>
                <div className="text-xl font-extrabold">{fmt(stmts.totals.debit)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">{isAr ? 'إجمالي دائن' : 'Total Credit'}</div>
                <div className="text-xl font-extrabold">{fmt(stmts.totals.credit)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">{isAr ? 'صافي الدخل' : 'Net Income'}</div>
                <div className={`text-xl font-extrabold ${stmts.income.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(stmts.income.netIncome)}
                </div>
              </Card>
              <Card className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{isAr ? 'الميزان' : 'Balance Check'}</div>
                  <div className="text-sm font-bold">
                    {stmts.balanceSheet.isBalanced ? (isAr ? 'متوازن' : 'Balanced') : (isAr ? 'غير متوازن' : 'Unbalanced')}
                  </div>
                </div>
                {stmts.balanceSheet.isBalanced
                  ? <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  : <AlertCircle className="h-7 w-7 text-red-500" />}
              </Card>
            </div>

            <Tabs defaultValue="income">
              <TabsList className="grid grid-cols-3 w-full max-w-lg">
                <TabsTrigger value="income">{isAr ? 'قائمة الدخل' : 'Income Statement'}</TabsTrigger>
                <TabsTrigger value="balance">{isAr ? 'الميزانية' : 'Balance Sheet'}</TabsTrigger>
                <TabsTrigger value="raw">{isAr ? 'البيانات' : 'Raw Data'}</TabsTrigger>
              </TabsList>

              <TabsContent value="income" className="space-y-4 mt-4">
                <div className="grid lg:grid-cols-2 gap-4">
                  <Card className="p-5">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" /> {isAr ? 'الإيرادات' : 'Revenue'}
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>{isAr ? 'الحساب' : 'Account'}</TableHead><TableHead className="text-end">{isAr ? 'القيمة' : 'Amount'}</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {stmts.income.revenues.map(r => (
                          <TableRow key={r.account}><TableCell>{r.account}</TableCell><TableCell className="text-end font-mono">{fmt(r.balance)}</TableCell></TableRow>
                        ))}
                        <TableRow className="font-bold bg-muted/50"><TableCell>{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</TableCell><TableCell className="text-end font-mono">{fmt(stmts.income.totalRevenue)}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                  <Card className="p-5">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" /> {isAr ? 'المصروفات' : 'Expenses'}
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>{isAr ? 'الحساب' : 'Account'}</TableHead><TableHead className="text-end">{isAr ? 'القيمة' : 'Amount'}</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {stmts.income.expenses.map(r => (
                          <TableRow key={r.account}><TableCell>{r.account}</TableCell><TableCell className="text-end font-mono">{fmt(r.balance)}</TableCell></TableRow>
                        ))}
                        <TableRow className="font-bold bg-muted/50"><TableCell>{isAr ? 'إجمالي المصروفات' : 'Total Expenses'}</TableCell><TableCell className="text-end font-mono">{fmt(stmts.income.totalExpense)}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                </div>

                <Card className="p-5">
                  <h3 className="font-bold mb-3">{isAr ? 'الإيرادات مقابل المصروفات' : 'Revenue vs Expenses'}</h3>
                  <div className="h-72">
                    <ResponsiveContainer>
                      <BarChart data={[
                        { name: isAr ? 'الإيرادات' : 'Revenue', value: stmts.income.totalRevenue },
                        { name: isAr ? 'المصروفات' : 'Expenses', value: stmts.income.totalExpense },
                        { name: isAr ? 'صافي الدخل' : 'Net Income', value: stmts.income.netIncome },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" /><YAxis /><RTooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          <Cell fill="#10b981" /><Cell fill="#ef4444" /><Cell fill="hsl(var(--primary))" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="balance" className="space-y-4 mt-4">
                <div className="grid lg:grid-cols-2 gap-4">
                  {([['asset', stmts.balanceSheet.assets, stmts.balanceSheet.totalAssets],
                     ['liability', stmts.balanceSheet.liabilities, stmts.balanceSheet.totalLiabilities],
                     ['equity', stmts.balanceSheet.equity, stmts.balanceSheet.totalEquity]] as const).map(([t, list, total]) => (
                    <Card key={t} className="p-5">
                      <h3 className="font-bold mb-3">{typeLabel(t as AccountType)}</h3>
                      <Table>
                        <TableHeader><TableRow><TableHead>{isAr ? 'الحساب' : 'Account'}</TableHead><TableHead className="text-end">{isAr ? 'القيمة' : 'Amount'}</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {list.map(r => (
                            <TableRow key={r.account}><TableCell>{r.account}</TableCell><TableCell className="text-end font-mono">{fmt(r.balance)}</TableCell></TableRow>
                          ))}
                          {t === 'equity' && (
                            <TableRow><TableCell className="italic text-muted-foreground">{isAr ? 'صافي دخل الفترة' : 'Net Income (Period)'}</TableCell><TableCell className="text-end font-mono italic">{fmt(stmts.income.netIncome)}</TableCell></TableRow>
                          )}
                          <TableRow className="font-bold bg-muted/50"><TableCell>{isAr ? 'الإجمالي' : 'Total'}</TableCell><TableCell className="text-end font-mono">{fmt(total as number)}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </Card>
                  ))}
                  <Card className="p-5">
                    <h3 className="font-bold mb-3">{isAr ? 'توزيع الأصول' : 'Assets Distribution'}</h3>
                    <div className="h-64">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={stmts.balanceSheet.assets.map(a => ({ name: a.account, value: Math.abs(a.balance) }))}
                               dataKey="value" nameKey="name" outerRadius={90} label>
                            {stmts.balanceSheet.assets.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Legend /><RTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
                <Card className="p-4 flex items-center justify-between">
                  <span className="text-sm font-bold">
                    {isAr ? 'الأصول = الخصوم + حقوق الملكية' : 'Assets = Liabilities + Equity'}
                  </span>
                  <Badge variant={stmts.balanceSheet.isBalanced ? 'default' : 'destructive'}>
                    {fmt(stmts.balanceSheet.totalAssets)} = {fmt(stmts.balanceSheet.totalLiabilities + stmts.balanceSheet.totalEquity)}
                  </Badge>
                </Card>
              </TabsContent>

              <TabsContent value="raw" className="mt-4">
                <Card className="p-5">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isAr ? 'الحساب' : 'Account'}</TableHead>
                        <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
                        <TableHead className="text-end">{isAr ? 'مدين' : 'Debit'}</TableHead>
                        <TableHead className="text-end">{isAr ? 'دائن' : 'Credit'}</TableHead>
                        <TableHead className="text-end">{isAr ? 'الرصيد' : 'Balance'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.account}</TableCell>
                          <TableCell><Badge variant="outline">{typeLabel(r.type)}</Badge></TableCell>
                          <TableCell className="text-end font-mono">{fmt(r.debit)}</TableCell>
                          <TableCell className="text-end font-mono">{fmt(r.credit)}</TableCell>
                          <TableCell className="text-end font-mono font-bold">{fmt(r.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
}