import { useState } from 'react';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, subMonths } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

export type DateRange = { from: Date | null; to: Date | null };

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
  className?: string;
}

const presets = [
  { value: 'all', label_ar: 'الكل', label_en: 'All Time' },
  { value: 'today', label_ar: 'اليوم', label_en: 'Today' },
  { value: 'yesterday', label_ar: 'أمس', label_en: 'Yesterday' },
  { value: 'week', label_ar: 'هذا الأسبوع', label_en: 'This Week' },
  { value: 'month', label_ar: 'هذا الشهر', label_en: 'This Month' },
  { value: '3months', label_ar: 'آخر 3 أشهر', label_en: 'Last 3 Months' },
  { value: 'year', label_ar: 'هذا العام', label_en: 'This Year' },
  { value: 'custom', label_ar: 'فترة مخصصة', label_en: 'Custom Range' },
];

function getPresetRange(value: string): DateRange {
  const now = new Date();
  switch (value) {
    case 'today':
      return { from: startOfDay(now), to: now };
    case 'yesterday': {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: startOfDay(now) };
    }
    case 'week':
      return { from: startOfWeek(now, { weekStartsOn: 0 }), to: now };
    case 'month':
      return { from: startOfMonth(now), to: now };
    case '3months':
      return { from: subMonths(now, 3), to: now };
    case 'year':
      return { from: startOfYear(now), to: now };
    default:
      return { from: null, to: null };
  }
}

export function DateRangeFilter({ onRangeChange, className }: DateRangeFilterProps) {
  const { language } = useLanguage();
  const [preset, setPreset] = useState('all');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const handlePresetChange = (value: string) => {
    setPreset(value);
    if (value !== 'custom') {
      onRangeChange(getPresetRange(value));
    }
  };

  const handleCustomApply = () => {
    onRangeChange({ from: customFrom || null, to: customTo || null });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presets.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {language === 'ar' ? p.label_ar : p.label_en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('w-36 justify-start text-left font-normal', !customFrom && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customFrom ? format(customFrom, 'yyyy-MM-dd') : (language === 'ar' ? 'من' : 'From')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('w-36 justify-start text-left font-normal', !customTo && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customTo ? format(customTo, 'yyyy-MM-dd') : (language === 'ar' ? 'إلى' : 'To')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customTo} onSelect={setCustomTo} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          <Button size="sm" onClick={handleCustomApply}>
            {language === 'ar' ? 'تطبيق' : 'Apply'}
          </Button>
        </div>
      )}
    </div>
  );
}
