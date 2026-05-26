import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Eye, AlertCircle, ShoppingBag } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_sar: number;
  total_usd: number;
  total_egp: number;
  currency_used: string;
  created_at: string;
  customer_name: string;
  order_items: { template_name: string; price: number; currency: string }[];
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; labelAr: string; labelEn: string }> = {
  pending: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', labelAr: 'في الانتظار', labelEn: 'Pending' },
  reviewing: { icon: Eye, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', labelAr: 'قيد المراجعة', labelEn: 'Reviewing' },
  confirmed: { icon: CheckCircle, color: 'bg-green-500/10 text-green-600 border-green-500/30', labelAr: 'مؤكد', labelEn: 'Confirmed' },
  cancelled: { icon: AlertCircle, color: 'bg-red-500/10 text-red-600 border-red-500/30', labelAr: 'ملغي', labelEn: 'Cancelled' },
};

export default function MyOrdersPage() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total_sar, total_usd, total_egp, currency_used, created_at, customer_name, order_items(template_name, price, currency)')
        .eq('customer_email', user.email!)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data as Order[]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user?.email]);

  const getTotal = (order: Order) => {
    switch (order.currency_used) {
      case 'USD': return `$${order.total_usd}`;
      case 'EGP': return `${order.total_egp} ج.م`;
      default: return `${order.total_sar} ر.س`;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {language === 'ar' ? 'سجل دخول لعرض طلباتك' : 'Sign in to view your orders'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {language === 'ar' ? 'يجب تسجيل الدخول أولاً لمتابعة طلباتك' : 'You need to sign in first to track your orders'}
          </p>
          <Link to="/auth">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">
          {language === 'ar' ? 'طلباتي' : 'My Orders'}
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              {language === 'ar' ? 'لا توجد طلبات بعد' : 'No orders yet'}
            </p>
            <Link to="/templates">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {language === 'ar' ? 'تصفح النماذج' : 'Browse Templates'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="font-mono text-sm text-muted-foreground">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${status.color} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {language === 'ar' ? status.labelAr : status.labelEn}
                        </Badge>
                        <span className="font-bold text-accent">{getTotal(order)}</span>
                      </div>
                    </div>
                    {order.order_items?.length > 0 && (
                      <div className="border-t border-border/50 pt-3">
                        <p className="text-sm text-muted-foreground mb-1">
                          {language === 'ar' ? 'المنتجات:' : 'Items:'}
                        </p>
                        <ul className="space-y-1">
                          {order.order_items.map((item, i) => (
                            <li key={i} className="text-sm flex justify-between">
                              <span>{item.template_name}</span>
                              <span className="text-muted-foreground">{item.price} {item.currency}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
