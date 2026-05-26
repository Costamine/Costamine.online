import { useEffect, useState, useCallback } from 'react';
import { Download, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangeFilter, DateRange } from '@/components/admin/DateRangeFilter';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface TemplateDownloadStats {
  id: string;
  name_ar: string;
  name_en: string;
  downloads_count: number;
  category_name_ar?: string;
  category_name_en?: string;
}

interface PeriodStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(210, 70%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(350, 65%, 55%)',
  'hsl(45, 80%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(180, 50%, 45%)',
];

export default function AdminDownloads() {
  const { language } = useLanguage();
  const [templates, setTemplates] = useState<TemplateDownloadStats[]>([]);
  const [periodStats, setPeriodStats] = useState<PeriodStats>({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange]);

  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const fetchData = async (range: DateRange) => {
    setIsLoading(true);
    try {
      // Fetch templates with categories
      const { data: templatesData } = await supabase
        .from('templates')
        .select('id, name_ar, name_en, downloads_count, category_id, template_categories(name_ar, name_en)');

      if (range.from) {
        // Get downloads from template_downloads filtered by date
        let dlQuery = supabase.from('template_downloads').select('template_id').gte('downloaded_at', range.from.toISOString());
        if (range.to) dlQuery = dlQuery.lte('downloaded_at', range.to.toISOString());
        const { data: dlData } = await dlQuery;

        const counts: Record<string, number> = {};
        dlData?.forEach(d => { counts[d.template_id] = (counts[d.template_id] || 0) + 1; });

        const mapped: TemplateDownloadStats[] = (templatesData || [])
          .map((t: any) => ({
            id: t.id, name_ar: t.name_ar, name_en: t.name_en,
            downloads_count: counts[t.id] || 0,
            category_name_ar: t.template_categories?.name_ar,
            category_name_en: t.template_categories?.name_en,
          }))
          .sort((a, b) => b.downloads_count - a.downloads_count);

        setTemplates(mapped);
        const total = mapped.reduce((s, t) => s + t.downloads_count, 0);
        setPeriodStats({ today: 0, thisWeek: 0, thisMonth: 0, total });
      } else {
        // No filter - use templates.downloads_count
        const mapped: TemplateDownloadStats[] = (templatesData || []).map((t: any) => ({
          id: t.id, name_ar: t.name_ar, name_en: t.name_en,
          downloads_count: t.downloads_count || 0,
          category_name_ar: t.template_categories?.name_ar,
          category_name_en: t.template_categories?.name_en,
        })).sort((a: TemplateDownloadStats, b: TemplateDownloadStats) => b.downloads_count - a.downloads_count);

        setTemplates(mapped);
        const totalDownloads = mapped.reduce((sum, t) => sum + t.downloads_count, 0);

        // Period stats
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [todayRes, weekRes, monthRes] = await Promise.all([
          supabase.from('template_downloads' as any).select('id', { count: 'exact', head: true }).gte('downloaded_at', todayStart),
          supabase.from('template_downloads' as any).select('id', { count: 'exact', head: true }).gte('downloaded_at', weekStart),
          supabase.from('template_downloads' as any).select('id', { count: 'exact', head: true }).gte('downloaded_at', monthStart),
        ]);

        setPeriodStats({
          today: (todayRes as any).count || 0,
          thisWeek: (weekRes as any).count || 0,
          thisMonth: (monthRes as any).count || 0,
          total: totalDownloads,
        });
      }
    } catch (error) {
      console.error('Error fetching download data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalDownloads = templates.reduce((sum, t) => sum + t.downloads_count, 0);

  const chartData = templates
    .filter(t => t.downloads_count > 0)
    .slice(0, 10)
    .map(t => ({
      name: language === 'ar' ? t.name_ar : t.name_en,
      downloads: t.downloads_count,
    }));

  const periodCards = [
    {
      title: language === 'ar' ? 'تحميلات اليوم' : 'Today',
      value: periodStats.today,
      icon: Calendar,
    },
    {
      title: language === 'ar' ? 'هذا الأسبوع' : 'This Week',
      value: periodStats.thisWeek,
      icon: TrendingUp,
    },
    {
      title: language === 'ar' ? 'هذا الشهر' : 'This Month',
      value: periodStats.thisMonth,
      icon: BarChart3,
    },
    {
      title: language === 'ar' ? 'إجمالي التحميلات' : 'Total Downloads',
      value: periodStats.total,
      icon: Download,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'ar' ? 'تقارير التحميلات' : 'Download Reports'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'تحليل تفصيلي لتحميلات النماذج' : 'Detailed template download analytics'}
          </p>
        </div>

        <DateRangeFilter onRangeChange={handleDateChange} />

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <>
            {/* Period Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {periodCards.map((card, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="table" className="space-y-4">
              <TabsList>
                <TabsTrigger value="table">
                  {language === 'ar' ? 'جدول التحميلات' : 'Downloads Table'}
                </TabsTrigger>
                <TabsTrigger value="chart">
                  {language === 'ar' ? 'رسم بياني' : 'Chart'}
                </TabsTrigger>
              </TabsList>

              {/* Table Tab */}
              <TabsContent value="table">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === 'ar' ? 'أكثر النماذج تحميلاً' : 'Most Downloaded Templates'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {templates.filter(t => t.downloads_count > 0).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {language === 'ar' ? 'لا توجد تحميلات بعد' : 'No downloads yet'}
                        </div>
                      ) : (
                        templates
                          .filter(t => t.downloads_count > 0)
                          .map((template, index) => {
                            const name = language === 'ar' ? template.name_ar : template.name_en;
                            const category = language === 'ar' ? template.category_name_ar : template.category_name_en;
                            const percentage = totalDownloads > 0 ? (template.downloads_count / totalDownloads) * 100 : 0;

                            return (
                              <div key={template.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</span>
                                    <div>
                                      <p className="font-medium text-foreground">{name}</p>
                                      {category && (
                                        <p className="text-xs text-muted-foreground">{category}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-end">
                                    <p className="font-bold text-foreground">{template.downloads_count.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                                  </div>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            );
                          })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Chart Tab */}
              <TabsContent value="chart">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === 'ar' ? 'رسم بياني للتحميلات' : 'Downloads Chart'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chartData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'ar' ? 'لا توجد بيانات للعرض' : 'No data to display'}
                      </div>
                    ) : (
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis type="number" className="text-xs fill-muted-foreground" />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={150}
                              className="text-xs fill-muted-foreground"
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                color: 'hsl(var(--foreground))',
                              }}
                              formatter={(value: number) => [value.toLocaleString(), language === 'ar' ? 'تحميلات' : 'Downloads']}
                            />
                            <Bar dataKey="downloads" radius={[0, 4, 4, 0]}>
                              {chartData.map((_, index) => (
                                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
