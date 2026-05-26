import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Insight } from '@/lib/analytics/insights';
import { TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  if (!insights.length) return null;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        {isAr ? 'رؤى تلقائية' : 'Auto Insights'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((ins, i) => {
          const Icon = ins.type === 'positive' ? TrendingUp : ins.type === 'negative' ? TrendingDown : Lightbulb;
          const color = ins.type === 'positive' ? 'text-green-500' : ins.type === 'negative' ? 'text-red-500' : 'text-blue-500';
          return (
            <div key={i} className="p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-xs text-muted-foreground">{isAr ? ins.titleAr : ins.titleEn}</span>
              </div>
              <div className="text-sm font-semibold">{isAr ? ins.valueAr : ins.valueEn}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}