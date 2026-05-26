import { useEffect, useState, useCallback } from 'react';
import { Download, TrendingUp, Calendar, BarChart3, MessageCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangeFilter, DateRange } from '@/components/admin/DateRangeFilter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface DemoDownloadRecord {
  id: string;
  template_id: string;
  user_email: string;
  downloaded_at: string;
  template_name_ar?: string;
  template_name_en?: string;
}

interface TemplateStats {
  template_id: string;
  name_ar: string;
  name_en: string;
  count: number;
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

export default function AdminDemoDownloads() {
  const { language } = useLanguage();
  const [downloads, setDownloads] = useState<DemoDownloadRecord[]>([]);
  const [templateStats, setTemplateStats] = useState<TemplateStats[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [uniqueUsers, setUniqueUsers] = useState(0);
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
      // Fetch demo downloads with template info
      let query = (supabase as any)
        .from('demo_downloads')
        .select('id, template_id, user_email, downloaded_at, templates(name_ar, name_en)')
        .order('downloaded_at', { ascending: false });

      if (range.from) {
        query = query.gte('downloaded_at', range.from.toISOString());
      }
      if (range.to) {
        query = query.lte('downloaded_at', range.to.toISOString());
      }

      const { data, error } = await query.limit(500);

      if (error) {
        console.error('Error fetching demo downloads:', error);
        setDownloads([]);
        setTemplateStats([]);
        setTotalCount(0);
        setUniqueUsers(0);
        return;
      }

      const records: DemoDownloadRecord[] = (data || []).map((d: any) => ({
        id: d.id,
        template_id: d.template_id,
        user_email: d.user_email,
        downloaded_at: d.downloaded_at,
        template_name_ar: d.templates?.name_ar,
        template_name_en: d.templates?.name_en,
      }));

      setDownloads(records);
      setTotalCount(records.length);

      // Unique users
      const emails = new Set(records.map(r => r.user_email));
      setUniqueUsers(emails.size);

      // Template stats
      const statsMap: Record<string, TemplateStats> = {};
      records.forEach(r => {
        if (!statsMap[r.template_id]) {
          statsMap[r.template_id] = {
            template_id: r.template_id,
            name_ar: r.template_name_ar || '',
            name_en: r.template_name_en || '',
            count: 0,
          };
        }
        statsMap[r.template_id].count++;
      });

      const stats = Object.values(statsMap).sort((a, b) => b.count - a.count);
      setTemplateStats(stats);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = (email: string, templateName: string) => {
    const message = language === 'ar'
      ? `مرحباً، لاحظنا أنك حملت النسخة التجريبية من "${templateName}". هل تحتاج مساعدة أو تريد شراء النسخة الكاملة؟`
      : `Hi, we noticed you downloaded the trial version of "${templateName}". Do you need help or would you like to purchase the full version?`;
    // Open WhatsApp with the message - admin will need to enter the phone number
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const chartData = templateStats.slice(0, 10).map(t => ({
    name: language === 'ar' ? t.name_ar : t.name_en,
    downloads: t.count,
  }));

  const statCards = [
    {
      title: language === 'ar' ? 'إجمالي التحميلات التجريبية' : 'Total Trial Downloads',
      value: totalCount,
      icon: Download,
    },
    {
      title: language === 'ar' ? 'عملاء فريدين' : 'Unique Users',
      value: uniqueUsers,
      icon: Users,
    },
    {
      title: language === 'ar' ? 'نماذج محملة' : 'Templates Downloaded',
      value: templateStats.length,
      icon: BarChart3,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'ar' ? 'تحميلات النسخ التجريبية' : 'Trial Downloads'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'تحليل تحميلات النسخ التجريبية والتواصل مع العملاء' : 'Trial download analytics and customer outreach'}
          </p>
        </div>

        <DateRangeFilter onRangeChange={handleDateChange} />

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {statCards.map((card, index) => (
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

            <Tabs defaultValue="log" className="space-y-4">
              <TabsList>
                <TabsTrigger value="log">
                  {language === 'ar' ? 'سجل التحميلات' : 'Download Log'}
                </TabsTrigger>
                <TabsTrigger value="stats">
                  {language === 'ar' ? 'إحصائيات النماذج' : 'Template Stats'}
                </TabsTrigger>
                <TabsTrigger value="chart">
                  {language === 'ar' ? 'رسم بياني' : 'Chart'}
                </TabsTrigger>
              </TabsList>

              {/* Download Log Tab */}
              <TabsContent value="log">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === 'ar' ? 'سجل تحميلات النسخ التجريبية' : 'Trial Download Log'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {downloads.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'ar' ? 'لا توجد تحميلات بعد' : 'No downloads yet'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{language === 'ar' ? 'النموذج' : 'Template'}</TableHead>
                              <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                              <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                              <TableHead>{language === 'ar' ? 'إجراء' : 'Action'}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {downloads.map((dl) => {
                              const templateName = language === 'ar' ? dl.template_name_ar : dl.template_name_en;
                              return (
                                <TableRow key={dl.id}>
                                  <TableCell className="font-medium">
                                    {templateName || '—'}
                                  </TableCell>
                                  <TableCell dir="ltr">{dl.user_email}</TableCell>
                                  <TableCell dir="ltr" className="text-sm text-muted-foreground">
                                    {new Date(dl.downloaded_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5 text-green-600 border-green-300 hover:bg-green-50"
                                      onClick={() => openWhatsApp(dl.user_email, templateName || '')}
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                      {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Template Stats Tab */}
              <TabsContent value="stats">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === 'ar' ? 'أكثر النماذج تحميلاً (تجريبية)' : 'Most Downloaded Trials'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {templateStats.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {templateStats.map((stat, index) => {
                          const name = language === 'ar' ? stat.name_ar : stat.name_en;
                          const percentage = totalCount > 0 ? (stat.count / totalCount) * 100 : 0;
                          return (
                            <div key={stat.template_id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</span>
                                  <p className="font-medium text-foreground">{name}</p>
                                </div>
                                <div className="text-end">
                                  <p className="font-bold text-foreground">{stat.count.toLocaleString()}</p>
                                  <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                                </div>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Chart Tab */}
              <TabsContent value="chart">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === 'ar' ? 'رسم بياني للتحميلات التجريبية' : 'Trial Downloads Chart'}
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
