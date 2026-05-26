import { useEffect, useState, useCallback } from 'react';
import { FileText, ShoppingBag, MessageSquare, DollarSign, Eye, Download, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

interface Stats {
  totalTemplates: number;
  totalOrders: number;
  pendingOrders: number;
  unreadMessages: number;
  totalRevenue: number;
  totalVisits: number;
  totalDownloads: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_sar: number;
  status: string;
  created_at: string;
}

interface TopTemplate {
  id: string;
  name_ar: string;
  name_en: string;
  downloads_count: number;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(210, 70%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(350, 65%, 55%)',
];

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalTemplates: 0,
    totalOrders: 0,
    pendingOrders: 0,
    unreadMessages: 0,
    totalRevenue: 0,
    totalVisits: 0,
    totalDownloads: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topTemplates, setTopTemplates] = useState<TopTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  useEffect(() => {
    fetchDashboardData(dateRange);
  }, [dateRange]);

  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const fetchDashboardData = async (range: DateRange) => {
    setIsLoading(true);
    try {
      // Fetch templates count and total downloads
      const { data: templatesData, count: templatesCount } = await supabase
        .from('templates')
        .select('id, name_ar, name_en, downloads_count', { count: 'exact' });

      // If date range is set, get downloads from template_downloads table for period
      let totalDownloads = 0;
      let periodTopTemplates: TopTemplate[] = [];

      if (range.from) {
        // Get downloads count per template for the period
        let downloadsQuery = supabase
          .from('template_downloads')
          .select('template_id')
          .gte('downloaded_at', range.from.toISOString());
        if (range.to) downloadsQuery = downloadsQuery.lte('downloaded_at', range.to.toISOString());
        
        const { data: dlData } = await downloadsQuery;
        totalDownloads = dlData?.length || 0;

        // Count per template
        const counts: Record<string, number> = {};
        dlData?.forEach(d => { counts[d.template_id] = (counts[d.template_id] || 0) + 1; });
        
        periodTopTemplates = (templatesData || [])
          .filter(t => counts[t.id])
          .map(t => ({ id: t.id, name_ar: t.name_ar, name_en: t.name_en, downloads_count: counts[t.id] }))
          .sort((a, b) => b.downloads_count - a.downloads_count)
          .slice(0, 5);
      } else {
        totalDownloads = templatesData?.reduce((sum, t) => sum + (t.downloads_count || 0), 0) || 0;
        periodTopTemplates = [...(templatesData || [])]
          .sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0))
          .filter(t => (t.downloads_count || 0) > 0)
          .slice(0, 5)
          .map(t => ({ id: t.id, name_ar: t.name_ar, name_en: t.name_en, downloads_count: t.downloads_count || 0 }));
      }
      setTopTemplates(periodTopTemplates);

      // Fetch orders stats with date filter
      let ordersQuery = supabase.from('orders').select('status, total_sar');
      if (range.from) ordersQuery = ordersQuery.gte('created_at', range.from.toISOString());
      if (range.to) ordersQuery = ordersQuery.lte('created_at', range.to.toISOString());
      const { data: orders } = await ordersQuery;

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const totalRevenue = orders
        ?.filter(o => ['completed', 'delivered'].includes(o.status))
        .reduce((sum, o) => sum + Number(o.total_sar), 0) || 0;

      // Fetch unread messages count with date filter
      let contactsQuery = supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('is_read', false);
      if (range.from) contactsQuery = contactsQuery.gte('created_at', range.from.toISOString());
      if (range.to) contactsQuery = contactsQuery.lte('created_at', range.to.toISOString());
      const { count: unreadCount } = await contactsQuery;

      // Fetch site visits count with date filter
      let visitsQuery = supabase.from('site_visits').select('*', { count: 'exact', head: true });
      if (range.from) visitsQuery = visitsQuery.gte('visited_at', range.from.toISOString());
      if (range.to) visitsQuery = visitsQuery.lte('visited_at', range.to.toISOString());
      const { count: visitsCount } = await visitsQuery;

      // Fetch recent orders
      let recentQuery = supabase.from('orders').select('id, order_number, customer_name, total_sar, status, created_at').order('created_at', { ascending: false }).limit(5);
      if (range.from) recentQuery = recentQuery.gte('created_at', range.from.toISOString());
      if (range.to) recentQuery = recentQuery.lte('created_at', range.to.toISOString());
      const { data: recent } = await recentQuery;

      setStats({
        totalTemplates: templatesCount || 0,
        totalOrders,
        pendingOrders,
        unreadMessages: unreadCount || 0,
        totalRevenue,
        totalVisits: visitsCount || 0,
        totalDownloads,
      });
      setRecentOrders(recent || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: language === 'ar' ? 'زيارات الموقع' : 'Site Visits',
      value: stats.totalVisits,
      icon: Eye,
      color: 'bg-purple-500',
    },
    {
      title: language === 'ar' ? 'إجمالي التحميلات' : 'Total Downloads',
      value: stats.totalDownloads,
      icon: Download,
      color: 'bg-cyan-500',
    },
    {
      title: language === 'ar' ? 'إجمالي النماذج' : 'Total Templates',
      value: stats.totalTemplates,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-green-500',
    },
    {
      title: language === 'ar' ? 'طلبات قيد المراجعة' : 'Pending Orders',
      value: stats.pendingOrders,
      icon: ShoppingBag,
      color: 'bg-yellow-500',
    },
    {
      title: language === 'ar' ? 'رسائل غير مقروءة' : 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: 'bg-red-500',
    },
    {
      title: language === 'ar' ? 'إجمالي الإيرادات (ر.س)' : 'Total Revenue (SAR)',
      value: stats.totalRevenue.toFixed(2),
      icon: DollarSign,
      color: 'bg-accent',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      pending: { 
        label: language === 'ar' ? 'قيد المراجعة' : 'Pending', 
        class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
      },
      completed: { 
        label: language === 'ar' ? 'مكتمل' : 'Completed', 
        class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
      },
      delivered: { 
        label: language === 'ar' ? 'تم التسليم' : 'Delivered', 
        class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
      },
      cancelled: { 
        label: language === 'ar' ? 'ملغي' : 'Cancelled', 
        class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
      },
      rejected: { 
        label: language === 'ar' ? 'مرفوض' : 'Rejected', 
        class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
      },
    };
    const s = statusMap[status] || statusMap.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.class}`}>{s.label}</span>;
  };

  const chartData = topTemplates.map(t => ({
    name: language === 'ar' ? t.name_ar : t.name_en,
    downloads: t.downloads_count,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'نظرة عامة على أداء الموقع' : 'Overview of site performance'}
          </p>
        </div>

        <DateRangeFilter onRangeChange={handleDateChange} />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Downloads Report Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Downloads Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'أكثر النماذج تحميلاً' : 'Top Downloads'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'أفضل 5 نماذج' : 'Top 5 templates'}
                </CardDescription>
              </div>
              <Link to="/admin/downloads">
                <Button variant="outline" size="sm">
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : topTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد تحميلات بعد' : 'No downloads yet'}
                </div>
              ) : (
                <div className="space-y-4">
                  {topTemplates.map((template, index) => {
                    const name = language === 'ar' ? template.name_ar : template.name_en;
                    const percentage = stats.totalDownloads > 0 
                      ? (template.downloads_count / stats.totalDownloads) * 100 
                      : 0;

                    return (
                      <div key={template.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-muted-foreground">#{index + 1}</span>
                            <span className="font-medium text-foreground truncate max-w-[180px]">{name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{template.downloads_count.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Downloads Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'رسم بياني للتحميلات' : 'Downloads Chart'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'أفضل 5 نماذج حسب التحميلات' : 'Top 5 by downloads'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
                </div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-xs fill-muted-foreground" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        className="text-xs fill-muted-foreground"
                        tick={{ fontSize: 11 }}
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
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'آخر الطلبات' : 'Recent Orders'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'آخر 5 طلبات مستلمة' : 'Last 5 orders received'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start py-3 px-4 font-medium text-muted-foreground">
                        {language === 'ar' ? 'رقم الطلب' : 'Order #'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium text-muted-foreground">
                        {language === 'ar' ? 'العميل' : 'Customer'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium text-muted-foreground">
                        {language === 'ar' ? 'المبلغ' : 'Amount'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium text-muted-foreground">
                        {language === 'ar' ? 'الحالة' : 'Status'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium text-muted-foreground">
                        {language === 'ar' ? 'التاريخ' : 'Date'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{order.order_number}</td>
                        <td className="py-3 px-4">{order.customer_name}</td>
                        <td className="py-3 px-4">{Number(order.total_sar).toFixed(2)} SAR</td>
                        <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
