import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Filters } from '@/lib/analytics/types';
import { X } from 'lucide-react';

const MONTH_AR: Record<number, string> = { 1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل', 5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس', 9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر' };
const MONTH_EN: Record<number, string> = { 1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec' };

interface Props {
  filters: Filters;
  setFilters: (f: Filters) => void;
  branches: string[];
  categories: string[];
  months: number[];
  year: number;
}

export function FiltersBar({ filters, setFilters, branches, categories, months, year }: Props) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const ML = isAr ? MONTH_AR : MONTH_EN;

  const setMonth = (m: number) => {
    const last = new Date(year, m, 0).getDate();
    setFilters({
      ...filters,
      from: new Date(year, m - 1, 1),
      to: new Date(year, m - 1, last, 23, 59, 59),
    });
  };

  const reset = () => setFilters({ from: null, to: null, branch: 'all', category: 'all', monthTab: 'all' });

  const isoDate = (d: Date | null) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground mb-1 block">{isAr ? '📅 من' : '📅 From'}</label>
          <Input type="date" value={isoDate(filters.from)} onChange={(e) => setFilters({ ...filters, from: e.target.value ? new Date(e.target.value) : null })} />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground mb-1 block">{isAr ? 'إلى' : 'To'}</label>
          <Input type="date" value={isoDate(filters.to)} onChange={(e) => setFilters({ ...filters, to: e.target.value ? new Date(e.target.value + 'T23:59:59') : null })} />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground mb-1 block">{isAr ? '🏪 الفرع' : '🏪 Branch'}</label>
          <Select value={filters.branch} onValueChange={(v) => setFilters({ ...filters, branch: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? '— كل الفروع —' : '— All Branches —'}</SelectItem>
              {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground mb-1 block">{isAr ? '🗂️ الفئة' : '🗂️ Category'}</label>
          <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">{isAr ? '— كل الفئات —' : '— All Categories —'}</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <X className="h-4 w-4" />
          {isAr ? 'إعادة ضبط' : 'Reset'}
        </Button>
      </div>

      {months.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">{isAr ? 'اختصارات شهرية:' : 'Quick months:'}</span>
          {months.map(m => (
            <Button key={m} variant="secondary" size="sm" onClick={() => setMonth(m)}>{ML[m]}</Button>
          ))}
        </div>
      )}
    </Card>
  );
}