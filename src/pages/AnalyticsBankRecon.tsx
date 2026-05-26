import { useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, Building2, BookOpen, GitCompareArrows, CheckCircle2, AlertTriangle } from 'lucide-react';
import { parseTransactions, reconcile, Txn } from '@/lib/analytics/bankReconciliation';

const MAX_MB = 10;

function DropZone({ label, hint, file, onFile, icon: Icon }: { label: string; hint: string; file: File | null; onFile: (f: File) => void; icon: any }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <Card
      className={`p-6 border-2 border-dashed transition-colors ${drag ? 'bg-accent/10 border-accent' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-bold mb-1">{label}</h3>
        <p className="text-xs text-muted-foreground mb-3">{hint}</p>
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
        <Button size="sm" onClick={() => ref.current?.click()}>
          <Upload className="h-4 w-4" /> {file ? file.name : 'Upload'}
        </Button>
      </div>
    </Card>
  );
}

export default function AnalyticsBankRecon() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === 'ar';
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [bank, setBank] = useState<Txn[]>([]);
  const [ledger, setLedger] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(false);

  const result = useMemo(() => (bank.length && ledger.length ? reconcile(bank, ledger) : null), [bank, ledger]);

  const fmt = (n: number) => new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }).format(n);
  const fmtDate = (d: Date | null) => d ? d.toISOString().slice(0, 10) : '—';

  const load = async (file: File, kind: 'bank' | 'ledger') => {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ title: isAr ? 'حجم الملف كبير' : 'File too large', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const txns = await parseTransactions(file, kind);
      if (kind === 'bank') { setBankFile(file); setBank(txns); }
      else { setLedgerFile(file); setLedger(txns); }
      toast({ title: isAr ? 'تم' : 'Loaded', description: `${txns.length} ${isAr ? 'عملية' : 'txns'}` });
    } catch (e: any) {
      toast({ title: isAr ? 'فشل' : 'Failed', description: e?.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <GitCompareArrows className="h-3.5 w-3.5" />
            {isAr ? 'مطابقة بنكية' : 'Bank Reconciliation'}
          </div>
          <h1 className="text-3xl font-extrabold">
            {isAr ? 'لوحة المطابقة البنكية' : 'Bank Reconciliation Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'ارفع كشف الحساب البنكي ودفتر الأستاذ ودع النظام يطابقهما تلقائياً.' : 'Upload bank statement & ledger; the system matches automatically.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <DropZone
            label={isAr ? 'كشف الحساب البنكي' : 'Bank Statement'}
            hint={isAr ? 'الأعمدة: التاريخ، الوصف، المبلغ' : 'Columns: Date, Description, Amount'}
            file={bankFile} onFile={(f) => load(f, 'bank')} icon={Building2}
          />
          <DropZone
            label={isAr ? 'دفتر الأستاذ' : 'Ledger Transactions'}
            hint={isAr ? 'الأعمدة: التاريخ، الوصف، المبلغ' : 'Columns: Date, Description, Amount'}
            file={ledgerFile} onFile={(f) => load(f, 'ledger')} icon={BookOpen}
          />
        </div>

        {loading && <p className="text-center text-sm text-muted-foreground">{isAr ? 'جاري المعالجة...' : 'Processing...'}</p>}

        {result && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">{isAr ? 'مطابقة' : 'Matched'}</div>
                <div className="text-2xl font-extrabold text-emerald-600">{result.matched.length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">{isAr ? 'ناقص في البنك' : 'Missing in Bank'}</div>
                <div className="text-2xl font-extrabold text-amber-600">{result.missingInBank.length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">{isAr ? 'ناقص في النظام' : 'Missing in System'}</div>
                <div className="text-2xl font-extrabold text-red-600">{result.missingInSystem.length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">{isAr ? 'نسبة التطابق' : 'Match Rate'}</div>
                <div className="text-2xl font-extrabold text-primary">{(result.matchRate * 100).toFixed(1)}%</div>
              </Card>
            </div>

            <Card className="p-4 flex items-center gap-3">
              {result.matchRate > 0.9
                ? <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                : <AlertTriangle className="h-6 w-6 text-amber-500" />}
              <div className="text-sm">
                <span className="font-bold">{isAr ? 'إجمالي البنك:' : 'Bank Total:'}</span> {fmt(result.totals.bank)} • {' '}
                <span className="font-bold">{isAr ? 'إجمالي الدفتر:' : 'Ledger Total:'}</span> {fmt(result.totals.ledger)} • {' '}
                <span className="font-bold">{isAr ? 'الفرق:' : 'Diff:'}</span> {fmt(result.totals.bank - result.totals.ledger)}
              </div>
            </Card>

            <Tabs defaultValue="matched">
              <TabsList className="grid grid-cols-3 w-full max-w-xl">
                <TabsTrigger value="matched">{isAr ? 'مطابق' : 'Matched'}</TabsTrigger>
                <TabsTrigger value="missingBank">{isAr ? 'ناقص في البنك' : 'Missing in Bank'}</TabsTrigger>
                <TabsTrigger value="missingSys">{isAr ? 'ناقص في النظام' : 'Missing in System'}</TabsTrigger>
              </TabsList>

              <TabsContent value="matched" className="mt-4">
                <Card className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isAr ? 'تاريخ بنك' : 'Bank Date'}</TableHead>
                        <TableHead>{isAr ? 'وصف بنك' : 'Bank Desc'}</TableHead>
                        <TableHead>{isAr ? 'تاريخ دفتر' : 'Ledger Date'}</TableHead>
                        <TableHead>{isAr ? 'وصف دفتر' : 'Ledger Desc'}</TableHead>
                        <TableHead className="text-end">{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                        <TableHead>{isAr ? 'الثقة' : 'Confidence'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.matched.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell>{fmtDate(m.bank.date)}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{m.bank.description}</TableCell>
                          <TableCell>{fmtDate(m.ledger.date)}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{m.ledger.description}</TableCell>
                          <TableCell className="text-end font-mono">{fmt(m.bank.amount)}</TableCell>
                          <TableCell><Badge variant={m.score > 0.85 ? 'default' : 'secondary'}>{(m.score * 100).toFixed(0)}%</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {(['missingBank', 'missingSys'] as const).map(key => {
                const list = key === 'missingBank' ? result.missingInBank : result.missingInSystem;
                return (
                  <TabsContent key={key} value={key} className="mt-4">
                    <Card className="p-4">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                          <TableHead>{isAr ? 'الوصف' : 'Description'}</TableHead>
                          <TableHead className="text-end">{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {list.map(t => (
                            <TableRow key={t.id}>
                              <TableCell>{fmtDate(t.date)}</TableCell>
                              <TableCell>{t.description}</TableCell>
                              <TableCell className="text-end font-mono">{fmt(t.amount)}</TableCell>
                            </TableRow>
                          ))}
                          {!list.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">—</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
}