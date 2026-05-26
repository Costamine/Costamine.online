import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const emptyCoupon = {
  code: '',
  discount_type: 'percentage',
  discount_value: 0,
  min_order_amount: 0,
  max_uses: null as number | null,
  is_active: true,
  expires_at: '',
};

export default function AdminCoupons() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCoupon);

  const fetchCoupons = async () => {
    const { data } = await (supabase as any)
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    setCoupons((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyCoupon, code: generateCode() });
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount || 0,
      max_uses: c.max_uses,
      is_active: c.is_active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
    });
    setDialogOpen(true);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleSave = async () => {
    if (!form.code.trim() || form.discount_value <= 0) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'أكمل البيانات المطلوبة' : 'Fill required fields', variant: 'destructive' });
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_amount: form.min_order_amount || 0,
      max_uses: form.max_uses || null,
      is_active: form.is_active,
      expires_at: form.expires_at || null,
    };

    let error;
    if (editingId) {
      ({ error } = await (supabase as any).from('coupons').update(payload).eq('id', editingId));
    } else {
      ({ error } = await (supabase as any).from('coupons').insert([payload]));
    }

    if (error) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: language === 'ar' ? 'تم الحفظ' : 'Saved' });
    setDialogOpen(false);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
    await (supabase as any).from('coupons').delete().eq('id', id);
    fetchCoupons();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase as any).from('coupons').update({ is_active: !current }).eq('id', id);
    fetchCoupons();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: language === 'ar' ? 'تم النسخ' : 'Copied', description: code });
  };

  const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{language === 'ar' ? 'الكوبونات والعروض' : 'Coupons & Promos'}</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة كوبون' : 'Add Coupon'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{language === 'ar' ? 'لا توجد كوبونات' : 'No coupons yet'}</div>
      ) : (
        <div className="grid gap-4">
          {coupons.map((c) => (
            <div key={c.id} className="bg-card p-4 rounded-xl border border-border/50 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-lg">{c.code}</span>
                  <button onClick={() => copyCode(c.code)}><Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></button>
                  {!c.is_active && <Badge variant="secondary">{language === 'ar' ? 'معطل' : 'Inactive'}</Badge>}
                  {isExpired(c.expires_at) && <Badge variant="destructive">{language === 'ar' ? 'منتهي' : 'Expired'}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value} SAR`}
                  {c.min_order_amount ? ` · ${language === 'ar' ? 'حد أدنى' : 'Min'}: ${c.min_order_amount} SAR` : ''}
                  {c.max_uses ? ` · ${c.used_count}/${c.max_uses} ${language === 'ar' ? 'استخدام' : 'uses'}` : ` · ${c.used_count} ${language === 'ar' ? 'استخدام' : 'uses'}`}
                  {c.expires_at ? ` · ${language === 'ar' ? 'ينتهي' : 'Expires'}: ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c.id, c.is_active)} />
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? (language === 'ar' ? 'تعديل كوبون' : 'Edit Coupon') : (language === 'ar' ? 'إضافة كوبون' : 'Add Coupon')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{language === 'ar' ? 'رمز الكوبون' : 'Coupon Code'}</label>
              <div className="flex gap-2">
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} dir="ltr" className="font-mono" />
                <Button variant="outline" size="sm" onClick={() => setForm({ ...form, code: generateCode() })}>
                  {language === 'ar' ? 'توليد' : 'Generate'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{language === 'ar' ? 'نوع الخصم' : 'Discount Type'}</label>
                <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{language === 'ar' ? 'نسبة مئوية %' : 'Percentage %'}</SelectItem>
                    <SelectItem value="fixed">{language === 'ar' ? 'مبلغ ثابت' : 'Fixed Amount'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{language === 'ar' ? 'قيمة الخصم' : 'Value'}</label>
                <Input type="number" min={0} value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{language === 'ar' ? 'حد أدنى للطلب' : 'Min Order (SAR)'}</label>
                <Input type="number" min={0} value={form.min_order_amount || ''} onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{language === 'ar' ? 'عدد الاستخدامات' : 'Max Uses'}</label>
                <Input type="number" min={0} placeholder={language === 'ar' ? 'غير محدود' : 'Unlimited'} value={form.max_uses || ''} onChange={e => setForm({ ...form, max_uses: Number(e.target.value) || null })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
              <Input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} dir="ltr" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <span className="text-sm">{language === 'ar' ? 'مفعل' : 'Active'}</span>
            </div>
            <Button onClick={handleSave} className="w-full">{language === 'ar' ? 'حفظ' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
