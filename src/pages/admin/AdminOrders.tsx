import { useEffect, useState, useCallback } from 'react';
import { Eye, Download, Check, X, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DateRangeFilter, DateRange } from '@/components/admin/DateRangeFilter';

interface OrderItem {
  id: string;
  template_name: string;
  price: number;
  currency: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_sar: number;
  total_usd: number;
  total_egp: number;
  currency_used: string;
  status: string;
  transfer_proof_url: string | null;
  notes: string | null;
  created_at: string;
}

export default function AdminOrders() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const extractTransferProofPath = (value: string) => {
    // We store transfer_proof_url as either:
    // - object path: "1770...png" (recommended)
    // - legacy public URL: https://.../storage/v1/object/public/transfer-proofs/<path>
    // Admin view must always use a signed URL because the bucket is private.
    const raw = value.trim();
    let pathname = raw;
    try {
      pathname = new URL(raw).pathname;
    } catch {
      // Not a URL; keep raw
    }

    const markers = [
      '/storage/v1/object/public/transfer-proofs/',
      '/storage/v1/object/sign/transfer-proofs/',
      '/storage/v1/object/transfer-proofs/',
    ];

    for (const m of markers) {
      if (pathname.includes(m)) return pathname.split(m)[1];
    }

    return raw.replace(/^transfer-proofs\//, '');
  };

  const openTransferProof = async (transferProofUrl: string) => {
    try {
      const objectPath = extractTransferProofPath(transferProofUrl);
      const { data, error } = await supabase.storage
        .from('transfer-proofs')
        .createSignedUrl(objectPath, 60 * 10);

      if (error || !data?.signedUrl) {
        console.error('Error creating signed URL:', error);
        toast({
          variant: 'destructive',
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: language === 'ar'
            ? 'تعذر فتح إثبات التحويل. حاول مرة أخرى.'
            : 'Could not open the transfer proof. Please try again.',
        });
        return;
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error opening transfer proof:', err);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar'
          ? 'تعذر فتح إثبات التحويل.'
          : 'Could not open the transfer proof.',
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (ordersData) {
        setOrders(ordersData);

        // Fetch order items for all orders
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', ordersData.map(o => o.id));

        if (itemsData) {
          const itemsByOrder: Record<string, OrderItem[]> = {};
          itemsData.forEach(item => {
            if (!itemsByOrder[item.order_id]) {
              itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push(item);
          });
          setOrderItems(itemsByOrder);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث حالة الطلب' : 'Order status updated',
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء التحديث' : 'Error updating status',
      });
    }
  };

  const confirmDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const deleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      // Delete order items first, then the order
      await supabase.from('order_items').delete().eq('order_id', orderToDelete.id);
      const { error } = await supabase.from('orders').delete().eq('id', orderToDelete.id);
      if (error) throw error;

      setOrders(orders.filter(o => o.id !== orderToDelete.id));
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف الطلب بنجاح' : 'Order deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء حذف الطلب' : 'Error deleting order',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: {
        label: language === 'ar' ? 'قيد المراجعة' : 'Pending',
        variant: 'secondary',
      },
      completed: {
        label: language === 'ar' ? 'مكتمل' : 'Completed',
        variant: 'default',
      },
      delivered: {
        label: language === 'ar' ? 'تم التسليم' : 'Delivered',
        variant: 'default',
      },
      cancelled: {
        label: language === 'ar' ? 'ملغي' : 'Cancelled',
        variant: 'destructive',
      },
      rejected: {
        label: language === 'ar' ? 'مرفوض' : 'Rejected',
        variant: 'destructive',
      },
    };
    const s = statusMap[status] || statusMap.pending;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const getTotal = (order: Order) => {
    switch (order.currency_used) {
      case 'USD': return `$${order.total_usd}`;
      case 'EGP': return `${order.total_egp} ج.م`;
      default: return `${order.total_sar} ر.س`;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {language === 'ar' ? 'إدارة الطلبات' : 'Manage Orders'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'مراجعة وإدارة طلبات العملاء' : 'Review and manage customer orders'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter onRangeChange={handleDateChange} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'جميع الطلبات' : 'All Orders'}</SelectItem>
                <SelectItem value="pending">{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</SelectItem>
                <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                <SelectItem value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</SelectItem>
                <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'رقم الطلب' : 'Order #'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'العميل' : 'Customer'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'المبلغ' : 'Amount'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'الحالة' : 'Status'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'إثبات التحويل' : 'Proof'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'التاريخ' : 'Date'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{order.order_number}</td>
                        <td className="py-3 px-4">
                          <div>{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                        </td>
                        <td className="py-3 px-4">{getTotal(order)}</td>
                        <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                        <td className="py-3 px-4">
                          {order.transfer_proof_url ? (
                            <button
                              type="button"
                              onClick={() => openTransferProof(order.transfer_proof_url!)}
                              className="text-accent hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {language === 'ar' ? 'عرض' : 'View'}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openOrderDetails(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!['cancelled', 'rejected'].includes(order.status) && (
                              <Select
                                value={order.status}
                                onValueChange={(value) => updateOrderStatus(order.id, value)}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</SelectItem>
                                  <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                                  <SelectItem value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</SelectItem>
                                  <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                                  <SelectItem value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => confirmDeleteOrder(order)}
                              title={language === 'ar' ? 'حذف الطلب' : 'Delete Order'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'} - {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                  <p className="font-medium">{selectedOrder.customer_email}</p>
                </div>
                {selectedOrder.customer_phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'رقم الجوال' : 'Phone'}</p>
                    <p className="font-medium">{selectedOrder.customer_phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">{language === 'ar' ? 'المنتجات' : 'Items'}</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  {orderItems[selectedOrder.id]?.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.template_name}</span>
                      <span>{item.price} {item.currency}</span>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-sm">{language === 'ar' ? 'لا توجد عناصر' : 'No items'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-muted/50 rounded-lg p-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">SAR</p>
                  <p className="font-bold">{selectedOrder.total_sar}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">USD</p>
                  <p className="font-bold">{selectedOrder.total_usd}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">EGP</p>
                  <p className="font-bold">{selectedOrder.total_egp}</p>
                </div>
              </div>

              {selectedOrder.transfer_proof_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{language === 'ar' ? 'إثبات التحويل' : 'Transfer Proof'}</p>
                  <button
                    type="button"
                    onClick={() => openTransferProof(selectedOrder.transfer_proof_url!)}
                    className="inline-flex items-center gap-2 text-accent hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    {language === 'ar' ? 'تحميل الإثبات' : 'Download Proof'}
                  </button>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'ملاحظات' : 'Notes'}</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تأكيد حذف الطلب' : 'Confirm Delete Order'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? `هل أنت متأكد من حذف الطلب ${orderToDelete?.order_number}؟ سيتم حذف الطلب وجميع عناصره نهائياً.`
                : `Are you sure you want to delete order ${orderToDelete?.order_number}? This will permanently delete the order and all its items.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={deleteOrder}>
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
