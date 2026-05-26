import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { orderFormSchema, orderItemSchema } from '@/lib/validations';

interface BankInfo {
  bank_name_ar: string;
  bank_name_en: string;
  account_name_ar: string;
  account_name_en: string;
  account_number: string;
  iban: string;
}

export default function CheckoutPage() {
  const { t, language } = useLanguage();
  const { formatPrice, currency } = useCurrency();
  const { items, totalPriceSAR, clearCart, appliedCoupon, discountAmount, finalPriceSAR } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [bankLoading, setBankLoading] = useState(true);

  useEffect(() => {
    const fetchBankInfo = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value_json')
          .eq('key', 'bank_info')
          .maybeSingle();

        if (data?.value_json && typeof data.value_json === 'object' && !Array.isArray(data.value_json)) {
          const json = data.value_json as Record<string, unknown>;
          setBankInfo({
            bank_name_ar: (json.bank_name_ar as string) || '',
            bank_name_en: (json.bank_name_en as string) || '',
            account_name_ar: (json.account_name_ar as string) || '',
            account_name_en: (json.account_name_en as string) || '',
            account_number: (json.account_number as string) || '',
            iban: (json.iban as string) || '',
          });
        }
      } catch (error) {
        console.error('Error fetching bank info:', error);
      } finally {
        setBankLoading(false);
      }
    };

    fetchBankInfo();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: language === 'ar' ? 'تم النسخ' : 'Copied',
      description: text,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: language === 'ar' ? 'الملف كبير جداً' : 'File too large',
          description: language === 'ar' ? 'الحد الأقصى 5 ميجا' : 'Maximum 5MB',
          variant: 'destructive',
        });
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login Required',
          description: language === 'ar' 
            ? 'يجب تسجيل الدخول لإتمام الطلب' 
            : 'You must be logged in to complete the order',
          variant: 'destructive',
        });
        navigate('/auth', { state: { from: '/checkout' } });
        setLoading(false);
        return;
      }

      // Calculate totals using final price (after coupon)
      const totalUSD = Number((finalPriceSAR / 3.75).toFixed(2));
      const totalEGP = Number((finalPriceSAR / 0.076).toFixed(2));

      // Validate order form data using zod schema
      const orderValidation = orderFormSchema.safeParse({
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone || null,
        total_sar: finalPriceSAR,
        total_usd: totalUSD,
        total_egp: totalEGP,
        currency_used: currency,
      });

      if (!orderValidation.success) {
        const errorMessage = orderValidation.error.errors[0]?.message || 
          (language === 'ar' ? 'بيانات غير صالحة' : 'Invalid data');
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      const validatedOrder = orderValidation.data;

      let proofUrl = null;

      // Upload proof if provided
      if (proofFile) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(proofFile.type)) {
          toast({
            title: t('common.error'),
            description: language === 'ar' ? 'نوع الملف غير مدعوم' : 'Unsupported file type',
            variant: 'destructive',
          });
          return;
        }

        const fileExt = proofFile.name.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
        if (!fileExt || !allowedExtensions.includes(fileExt)) {
          toast({
            title: t('common.error'),
            description: language === 'ar' ? 'امتداد الملف غير مدعوم' : 'Unsupported file extension',
            variant: 'destructive',
          });
          return;
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const fileName = `${currentUser!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('transfer-proofs')
          .upload(fileName, proofFile);

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          toast({
            title: t('common.error'),
            description: language === 'ar' 
              ? 'حدث خطأ أثناء رفع الملف. تأكد من تسجيل الدخول والمحاولة مرة أخرى.' 
              : 'Error uploading file. Please make sure you are logged in and try again.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        // NOTE: transfer-proofs bucket is private. Store the object path and let admins
        // open it via a signed URL (instead of a public URL which will 404).
        proofUrl = fileName;
      }

      // Create order with validated data
      const orderId = crypto.randomUUID();
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          order_number: 'TEMP',
          customer_name: validatedOrder.customer_name,
          customer_email: validatedOrder.customer_email,
          customer_phone: validatedOrder.customer_phone,
          total_sar: validatedOrder.total_sar,
          total_usd: validatedOrder.total_usd,
          total_egp: validatedOrder.total_egp,
          currency_used: validatedOrder.currency_used,
          transfer_proof_url: proofUrl,
          status: proofUrl ? 'reviewing' : 'pending',
        }])
        .select('order_number')
        .single();

      if (orderError) throw orderError;
      const orderNumber = orderData?.order_number || orderId;

      // Validate and create order items
      const orderItems = items.map((item) => {
        const itemData = {
          order_id: orderId,
          template_id: item.id,
          template_name: (language === 'ar' ? item.name_ar : item.name_en).slice(0, 255),
          price: item.price_sar,
          currency: 'SAR',
        };
        
        const itemValidation = orderItemSchema.safeParse(itemData);
        if (!itemValidation.success) {
          throw new Error(itemValidation.error.errors[0]?.message || 'Invalid item data');
        }
        // Return explicit object to satisfy TypeScript
        return {
          order_id: itemValidation.data.order_id,
          template_id: itemValidation.data.template_id ?? null,
          template_name: itemValidation.data.template_name,
          price: itemValidation.data.price,
          currency: itemValidation.data.currency,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send notification
      try {
        const { data: notificationResult } = await supabase.functions.invoke('send-notification', {
          body: {
            type: 'order',
            data: {
              order_number: orderNumber,
              customer_name: validatedOrder.customer_name,
              customer_email: validatedOrder.customer_email,
              customer_phone: validatedOrder.customer_phone,
              total_sar: validatedOrder.total_sar,
              items_count: items.length,
            },
          },
        });
        
        if (notificationResult?.whatsappUrl) {
          console.log('WhatsApp notification URL:', notificationResult.whatsappUrl);
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      // Send order receipt email to customer
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'order-receipt',
            recipientEmail: validatedOrder.customer_email,
            idempotencyKey: `order-receipt-${orderId}`,
            templateData: {
              customerName: validatedOrder.customer_name,
              orderNumber,
              totalSar: validatedOrder.total_sar,
              itemsCount: items.length,
            },
          },
        });
      } catch (emailError) {
        console.error('Error sending order receipt email:', emailError);
      }

      // Increment coupon usage if applied
      if (appliedCoupon) {
        try {
          await (supabase as any).rpc('increment_coupon_usage', { coupon_code: appliedCoupon.code });
        } catch (e) {
          // Non-critical, don't fail the order
          console.error('Error incrementing coupon usage:', e);
        }
      }

      // Success
      setOrderSuccess(orderNumber);
      clearCart();

    } catch (error: any) {
      console.error('Error creating order:', error);
      
      if (error?.message?.includes('row-level security') || error?.statusCode === 403) {
        toast({
          title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login Required',
          description: language === 'ar' 
            ? 'يجب تسجيل الدخول لإتمام الطلب. سيتم توجيهك لصفحة تسجيل الدخول.' 
            : 'You must be logged in to complete the order. Redirecting to login.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/auth', { state: { from: '/checkout' } }), 1500);
        return;
      }
      
      let errorMessage = language === 'ar' ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'An error occurred, please try again';
      
      if (error?.message?.includes('storage') || error?.message?.includes('upload')) {
        errorMessage = language === 'ar' 
          ? 'حدث خطأ أثناء رفع الملف. تأكد من حجم الملف ونوعه.' 
          : 'Error uploading file. Check file size and type.';
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {t('checkout.success')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {language === 'ar' 
                ? 'سيتم التواصل معك خلال 24 ساعة لتسليم الملفات' 
                : 'You will be contacted within 24 hours for file delivery'}
            </p>
            <div className="bg-card p-4 rounded-xl border border-border/50 mb-8">
              <p className="text-sm text-muted-foreground mb-1">{t('checkout.orderNumber')}</p>
              <p className="text-xl font-bold text-accent">{orderSuccess}</p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline">
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">{t('checkout.title')}</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - Form */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {t('checkout.customerInfo')}
              </h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('checkout.name')} *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('checkout.email')} *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('checkout.phone')}
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    dir="ltr"
                  />
                </div>

                {/* Bank Info */}
                <div className="border-t border-border pt-4 mt-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    {t('checkout.bankInfo')}
                  </h3>
                  {bankLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : bankInfo ? (
                    <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('checkout.bankName')}</span>
                        <span className="font-medium">
                          {language === 'ar' ? bankInfo.bank_name_ar : bankInfo.bank_name_en}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('checkout.accountName')}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {language === 'ar' ? bankInfo.account_name_ar : bankInfo.account_name_en}
                          </span>
                          <button type="button" onClick={() => copyToClipboard(language === 'ar' ? bankInfo.account_name_ar : bankInfo.account_name_en)}>
                            <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('checkout.accountNumber')}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium" dir="ltr">{bankInfo.account_number}</span>
                          <button type="button" onClick={() => copyToClipboard(bankInfo.account_number)}>
                            <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('checkout.iban')}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm" dir="ltr">{bankInfo.iban}</span>
                          <button type="button" onClick={() => copyToClipboard(bankInfo.iban)}>
                            <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center py-4">
                      {language === 'ar' ? 'معلومات البنك غير متوفرة' : 'Bank info not available'}
                    </div>
                  )}
                </div>

                {/* Upload Proof */}
                <div className="border-t border-border pt-4">
                  <label className="block text-sm font-medium mb-2">
                    {t('checkout.uploadProof')}
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label htmlFor="proof-upload" className="cursor-pointer">
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      {proofFile ? (
                        <p className="text-foreground font-medium">{proofFile.name}</p>
                      ) : (
                        <p className="text-muted-foreground">
                          {language === 'ar' ? 'اضغط لرفع صورة إثبات التحويل' : 'Click to upload transfer proof'}
                        </p>
                      )}
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    t('checkout.submit')
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Right - Order Summary */}
          <div>
            <div className="bg-card p-6 rounded-xl border border-border/50 sticky top-24">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0">
                      {item.preview_image_url ? (
                        <img
                          src={item.preview_image_url}
                          alt={language === 'ar' ? item.name_ar : item.name_en}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                          <span className="text-lg font-bold text-primary/30">
                            {(language === 'ar' ? item.name_ar : item.name_en).charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground line-clamp-1">
                        {language === 'ar' ? item.name_ar : item.name_en}
                      </p>
                      <p className="text-accent">{formatPrice(item.price_sar)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'كوبون' : 'Coupon'}: <span className="font-mono">{appliedCoupon.code}</span>
                    </span>
                    <span className="text-green-600">- {formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('cart.total')}</span>
                  <span className="text-accent">{formatPrice(finalPriceSAR)}</span>
                </div>
              </div>

              {/* Notice */}
              <div className="mt-6 p-4 bg-warning/10 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'بعد التحويل، يرجى رفع صورة إثبات التحويل لتسريع معالجة طلبك'
                    : 'After transfer, please upload the proof to speed up your order processing'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
