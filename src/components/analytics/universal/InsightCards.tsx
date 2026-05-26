import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Star, AlertTriangle, BarChart3, Repeat } from 'lucide-react';
import { SmartInsight } from '@/lib/analytics/smartProfiler';

const ICONS = {
  top: { Icon: Star, color: 'text-amber-500 bg-amber-500/10' },
  bottom: { Icon: TrendingDown, color: 'text-rose-500 bg-rose-500/10' },
  trend: { Icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
  frequent: { Icon: Repeat, color: 'text-violet-500 bg-violet-500/10' },
  outlier: { Icon: AlertTriangle, color: 'text-orange-500 bg-orange-500/10' },
  distribution: { Icon: BarChart3, color: 'text-cyan-500 bg-cyan-500/10' },
};

export function InsightCards({ insights }: { insights: SmartInsight[] }) {
  if (!insights.length) return null;
  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-500" />
        رؤى ذكية تلقائية
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((ins, i) => {
          const meta = ICONS[ins.kind] ?? ICONS.distribution;
          const { Icon, color } = meta;
          return (
            <div key={i} className="p-3 rounded-lg border bg-card/50 hover:border-accent/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{ins.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{ins.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}