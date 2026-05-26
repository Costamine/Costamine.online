import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeaturesVisibility } from '@/hooks/useFeaturesVisibility';
import { supabase } from '@/integrations/supabase/client';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { VideoModal } from '@/components/templates/VideoModal';
import { FileSpreadsheet, TrendingUp, BarChart3, ArrowLeft, ArrowRight, Sparkles, Scale, GitCompareArrows, ShieldCheck } from 'lucide-react';

export default function AnalyticsHub() {
  const { language } = useLanguage();
  const { features } = useFeaturesVisibility();
  const isAr = language === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [analyticsTemplates, setAnalyticsTemplates] = useState<any[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .eq('display_location', 'analytics')
        .order('created_at', { ascending: false });
      setAnalyticsTemplates(data || []);
    })();
  }, []);

  const allDashboards = [
    {
      key: 'sales',
      to: '/analytics/live',
      icon: TrendingUp,
      gradient: 'from-amber-400 to-orange-500',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      title: isAr ? 'داشبورد تحليل المبيعات' : 'Sales Analytics Dashboard',
      subtitle: isAr ? 'تحليل شامل بنموذج جاهز' : 'Full analysis with ready template',
      desc: isAr
        ? 'ارفع ملف Excel بالنموذج الجاهز للحصول على تحليل النمو السنوي (YoY)، مقارنة الفروع، فلاتر متقدمة، ورسوم بيانية تفاعلية.'
        : 'Upload a ready Excel file to get YoY growth analysis, branch comparisons, advanced filters, and interactive charts.',
      tags: isAr ? ['نمو سنوي', 'مقارنات', 'تحليل'] : ['YoY Growth', 'Comparisons', 'Analysis'],
      badge: isAr ? 'جديد' : 'NEW',
    },
    {
      key: 'smart',
      to: '/analytics/excel',
      icon: FileSpreadsheet,
      gradient: 'from-emerald-400 to-teal-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      title: isAr ? 'التحليل الذكي الشامل' : 'Universal Smart Analytics',
      subtitle: isAr ? 'ارفع أي ملف بدون نموذج' : 'Upload any file — no template',
      desc: isAr
        ? 'ارفع أي ملف Excel — النظام يكتشف نوع كل عمود (تاريخ/رقم/تصنيف)، يبني KPIs تلقائياً، ويختار أنسب الرسوم البيانية بدون إعداد مسبق.'
        : 'Upload any Excel file — the system detects each column type (date/number/category), builds KPIs automatically, and picks the best charts with zero setup.',
      tags: isAr ? ['ديناميكي', 'Auto-Detect', 'بدون نموذج'] : ['Dynamic', 'Auto-Detect', 'Zero-Config'],
      badge: isAr ? 'ذكي' : 'SMART',
    },
    {
      key: 'trial-balance',
      to: '/analytics/trial-balance',
      icon: Scale,
      gradient: 'from-blue-400 to-indigo-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      title: isAr ? 'ميزان المراجعة → القوائم المالية' : 'Trial Balance → Financials',
      subtitle: isAr ? 'قائمة الدخل والميزانية تلقائياً' : 'Auto Income Statement & Balance Sheet',
      desc: isAr
        ? 'ارفع ميزان مراجعة (الحساب، مدين، دائن). النظام يصنّف الحسابات تلقائياً ويُنشئ قائمة الدخل والميزانية مع رسوم بيانية.'
        : 'Upload a trial balance (Account, Debit, Credit). Auto-classifies accounts and builds Income Statement & Balance Sheet with charts.',
      tags: isAr ? ['محاسبي', 'تصنيف ذكي', 'Charts'] : ['Accounting', 'Auto-Classify', 'Charts'],
      badge: isAr ? 'محاسبي' : 'ACC',
    },
    {
      key: 'bank-recon',
      to: '/analytics/bank-reconciliation',
      icon: GitCompareArrows,
      gradient: 'from-rose-400 to-pink-500',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-500',
      title: isAr ? 'المطابقة البنكية' : 'Bank Reconciliation',
      subtitle: isAr ? 'مطابقة كشف الحساب مع الدفاتر' : 'Match bank statement with ledger',
      desc: isAr
        ? 'ارفع كشف الحساب البنكي ودفتر الأستاذ. النظام يطابق العمليات حسب المبلغ والتاريخ والوصف ويعرض الفروقات ونسبة التطابق.'
        : 'Upload bank statement & ledger. Matches transactions by amount, date proximity, and description similarity with match rate.',
      tags: isAr ? ['مطابقة', 'كشف بنك', 'دفتر أستاذ'] : ['Matching', 'Bank', 'Ledger'],
      badge: isAr ? 'بنكي' : 'BANK',
    },
    {
      key: 'bank-statement',
      to: '/analytics/bank-statement',
      icon: ShieldCheck,
      gradient: 'from-cyan-400 to-sky-500',
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-500',
      title: isAr ? 'تحليل كشف الحساب البنكي' : 'Bank Statement Analyzer',
      subtitle: isAr ? 'خاص 100% — معالجة محلية بدون رفع' : '100% Private — local, no upload',
      desc: isAr
        ? 'ارفع كشف حساب Excel/CSV واحصل على لوحة تحليل احترافية فورية: KPIs، رسوم، تصنيف تلقائي، كشف شذوذ. كل شيء داخل متصفحك ولا يُحفظ.'
        : 'Upload an Excel/CSV bank statement and get an instant pro dashboard: KPIs, charts, auto-categorization, anomalies — all in your browser, nothing stored.',
      tags: isAr ? ['خصوصية', 'محلي', 'بنكي'] : ['Privacy', 'Local', 'Banking'],
      badge: isAr ? 'خاص' : 'PRIVATE',
    },
  ];

  const enabledMap: Record<string, boolean> = {
    'sales': features.analytics_sales_enabled,
    'smart': features.analytics_smart_enabled,
    'trial-balance': features.analytics_trial_balance_enabled,
    'bank-recon': features.analytics_bank_recon_enabled,
    'bank-statement': features.analytics_bank_statement_enabled,
  };
  const dashboards = allDashboards.filter(d => enabledMap[d.key]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? 'مركز التحليلات' : 'Analytics Hub'}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center justify-center gap-2">
            <BarChart3 className="h-8 w-8 text-accent" />
            {isAr ? 'تحليل البيانات' : 'Data Analysis'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'اختر نوع التحليل المناسب لك وارفع ملف Excel للحصول على تحليل فوري واحترافي.'
              : 'Choose the analysis type that fits you and upload an Excel file for instant professional results.'}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {dashboards.map((d) => {
            const Icon = d.icon;
            return (
              <Link key={d.to} to={d.to} className="group">
                <Card className="relative h-full p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border hover:border-accent/40">
                  {/* Gradient top stripe */}
                  <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${d.gradient}`} />
                  {/* Glow */}
                  <div className={`absolute -top-12 -end-12 w-44 h-44 rounded-full bg-gradient-to-br ${d.gradient} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

                  {d.badge && (
                    <Badge className="absolute top-4 end-4 bg-amber-500 text-amber-950 hover:bg-amber-500 font-bold">
                      {d.badge}
                    </Badge>
                  )}

                  <div className={`w-14 h-14 rounded-2xl ${d.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-7 w-7 ${d.iconColor}`} />
                  </div>

                  <h3 className="text-xl font-extrabold mb-1">{d.title}</h3>
                  <p className="text-xs text-muted-foreground font-semibold mb-3">{d.subtitle}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{d.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {d.tags.map(t => (
                      <span key={t} className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground">{t}</span>
                    ))}
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-sm font-bold text-accent group-hover:gap-3 transition-all">
                    {isAr ? 'فتح صفحة التحليل' : 'Open Analysis Page'}
                    <Arrow className="h-4 w-4" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          {isAr
            ? '💡 جميع التحليلات تدعم الوضع الداكن، اللغتين العربية والإنجليزية، وتصدير التقارير.'
            : '💡 All analyses support dark mode, Arabic & English, and report exports.'}
        </p>

        {analyticsTemplates.length > 0 && (
          <div className="mt-14">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-1">
                {isAr ? 'نماذج تحليلية جاهزة' : 'Ready Analytics Templates'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? 'نماذج وأدوات يمكنك تحميلها أو تجربتها مباشرة.'
                  : 'Templates and tools you can download or try instantly.'}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {analyticsTemplates.map((t) => (
                <TemplateCard key={t.id} template={t} onVideoClick={setVideoUrl} />
              ))}
            </div>
          </div>
        )}
      </div>
      <VideoModal isOpen={!!videoUrl} onClose={() => setVideoUrl(null)} videoUrl={videoUrl} />
    </Layout>
  );
}