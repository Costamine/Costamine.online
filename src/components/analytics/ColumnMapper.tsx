import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle2, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';
import { DetectedField, FieldKey, Mapping } from '@/lib/analytics/autoDetectColumns';

interface Props {
  detected: DetectedField[];
  headers: string[];
  initialMapping: Mapping;
  onConfirm: (mapping: Mapping) => void;
  onCancel: () => void;
}

const FIELD_LABELS: Record<FieldKey, { ar: string; en: string; required: boolean }> = {
  date: { ar: 'التاريخ', en: 'Date', required: true },
  value: { ar: 'القيمة / المبيعات', en: 'Value / Sales', required: true },
  qty: { ar: 'الكمية', en: 'Quantity', required: false },
  branch: { ar: 'الفرع', en: 'Branch', required: false },
  category: { ar: 'الفئة', en: 'Category', required: false },
};

const NONE = '__none__';

export function ColumnMapper({ detected, headers, initialMapping, onConfirm, onCancel }: Props) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [mapping, setMapping] = useState<Mapping>(initialMapping);

  const set = (field: FieldKey, col: string) => {
    setMapping(m => ({ ...m, [field]: col === NONE ? null : col }));
  };

  const valid = !!mapping.date && !!mapping.value;

  const conf = (f: FieldKey) => detected.find(d => d.field === f)?.confidence ?? 'none';

  const ConfBadge = ({ c }: { c: 'high' | 'medium' | 'low' | 'none' }) => {
    if (c === 'high') return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 gap-1"><CheckCircle2 className="h-3 w-3" />{isAr ? 'مؤكد' : 'High'}</Badge>;
    if (c === 'medium') return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 gap-1"><HelpCircle className="h-3 w-3" />{isAr ? 'مرجّح' : 'Medium'}</Badge>;
    if (c === 'low') return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/10 gap-1"><AlertCircle className="h-3 w-3" />{isAr ? 'منخفض' : 'Low'}</Badge>;
    return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" />{isAr ? 'غير مكتشف' : 'None'}</Badge>;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-violet-500" />
        <h3 className="text-lg font-bold">{isAr ? 'ربط الأعمدة' : 'Column Mapping'}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        {isAr ? 'تأكد من الربط التلقائي أو عدّله يدوياً قبل المتابعة.' : 'Confirm auto-detection or adjust mapping manually before continuing.'}
      </p>

      <div className="space-y-3">
        {(Object.keys(FIELD_LABELS) as FieldKey[]).map((f) => {
          const label = FIELD_LABELS[f];
          return (
            <div key={f} className="grid grid-cols-12 items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="col-span-12 md:col-span-4 flex items-center gap-2">
                <span className="font-semibold text-sm">{isAr ? label.ar : label.en}</span>
                {label.required && <Badge variant="outline" className="text-[10px]">{isAr ? 'مطلوب' : 'Required'}</Badge>}
              </div>
              <div className="col-span-12 md:col-span-5">
                <Select value={mapping[f] ?? NONE} onValueChange={(v) => set(f, v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={isAr ? 'اختر عمود' : 'Select column'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— {isAr ? 'بدون' : 'None'} —</SelectItem>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-12 md:col-span-3 flex justify-end">
                <ConfBadge c={conf(f)} />
              </div>
            </div>
          );
        })}
      </div>

      {!valid && (
        <div className="mt-4 flex items-center gap-2 text-xs text-rose-500">
          <AlertCircle className="h-4 w-4" />
          {isAr ? 'يجب ربط حقلي التاريخ والقيمة على الأقل.' : 'Date and Value fields must be mapped.'}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="outline" onClick={onCancel}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
        <Button disabled={!valid} onClick={() => onConfirm(mapping)} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
          {isAr ? 'تأكيد وتحليل' : 'Confirm & Analyze'}
        </Button>
      </div>
    </Card>
  );
}
