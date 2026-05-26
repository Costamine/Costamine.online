import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mapping } from '@/lib/analytics/autoDetectColumns';

interface Props {
  rows: Record<string, any>[];
  mapping: Mapping;
  limit?: number;
}

export function DataPreviewTable({ rows, mapping, limit = 20 }: Props) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const cols = Object.entries(mapping).filter(([, v]) => v) as [string, string][];
  const slice = rows.slice(0, limit);

  if (!cols.length) return null;

  return (
    <Card className="p-4 overflow-x-auto">
      <h3 className="text-sm font-bold mb-3">
        {isAr ? `معاينة البيانات (أول ${slice.length} صف)` : `Data Preview (first ${slice.length} rows)`}
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            {cols.map(([f, c]) => (
              <TableHead key={f}>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-muted-foreground">{f}</span>
                  <span className="font-semibold">{c}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {slice.map((r, i) => (
            <TableRow key={i}>
              {cols.map(([f, c]) => {
                const v = r[c];
                const display = v instanceof Date ? v.toLocaleDateString() : String(v ?? '');
                return <TableCell key={f} className="text-sm">{display}</TableCell>;
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
