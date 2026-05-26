import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { Aggregations } from '@/lib/analytics/types';
import { Search } from 'lucide-react';

export function CategoryTable({ agg }: { agg: Aggregations }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const data = agg.byCategory.map((c, i) => ({
      rank: i + 1,
      name: c.name,
      value: c.value,
      qty: c.qty,
      avg: c.qty > 0 ? c.value / c.qty : 0,
      share: agg.totalValue > 0 ? (c.value / agg.totalValue) * 100 : 0,
    }));
    if (!q.trim()) return data;
    const ql = q.toLowerCase();
    return data.filter(r => r.name.toLowerCase().includes(ql));
  }, [agg, q]);

  const top10Qty = [...agg.byCategory].sort((a, b) => b.qty - a.qty).slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="text-sm font-semibold">{isAr ? 'جميع الفئات — تفصيلي' : 'All Categories — Detail'}</h3>
          <div className="relative w-48">
            <Search className="absolute top-2.5 start-2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isAr ? 'بحث...' : 'Search...'} className="ps-8 h-9" />
          </div>
        </div>
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{isAr ? 'الفئة' : 'Category'}</TableHead>
                <TableHead className="text-end">{isAr ? 'القيمة' : 'Value'}</TableHead>
                <TableHead className="text-end">{isAr ? 'الكمية' : 'Qty'}</TableHead>
                <TableHead className="text-end">{isAr ? 'متوسط' : 'Avg'}</TableHead>
                <TableHead className="text-end">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.name}>
                  <TableCell className="text-muted-foreground">{r.rank}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-end">{Math.round(r.value).toLocaleString()}</TableCell>
                  <TableCell className="text-end">{Math.round(r.qty).toLocaleString()}</TableCell>
                  <TableCell className="text-end">{Math.round(r.avg).toLocaleString()}</TableCell>
                  <TableCell className="text-end">{r.share.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{isAr ? 'أعلى 10 فئات بالكمية' : 'Top 10 by Qty'}</h3>
        <div className="space-y-2 max-h-[400px] overflow-auto">
          {top10Qty.map((c, i) => {
            const max = top10Qty[0]?.qty || 1;
            const pct = (c.qty / max) * 100;
            return (
              <div key={c.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium truncate">{i + 1}. {c.name}</span>
                  <span className="text-muted-foreground">{Math.round(c.qty).toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}