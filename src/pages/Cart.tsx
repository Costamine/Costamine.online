import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft, Tag, X, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

export default function CartPage() {
  const { t, language, direction } = useLanguage();
  const { formatPrice } = useCurrency();
  const { items, removeItem, clearCart, totalPriceSAR, appliedCoupon, discountAmount, finalPriceSAR, applyCoupon, removeCoupon } = useCart();
  const { toast } = useToast();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const result = await applyCoupon(couponCode);
    setCouponLoading(false);
    toast({
      title: result.success
        ? (language === 'ar' ? 'تم التطبيق' : 'Applied')
        : (language === 'ar' ? 'خطأ' : 'Error'),
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    if (result.success) setCouponCode('');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">{t('cart.title')}</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-20 h-20 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground mb-6">{t('cart.empty')}</p>
            <Link to="/templates">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                {t('nav.browseTemplates')}
                <ArrowIcon className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-card p-4 rounded-xl border border-border/50 flex gap-4"
                >
                  <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden shrink-0">
                    {item.preview_image_url ? (
                      <img
                        src={item.preview_image_url}
                        alt={language === 'ar' ? item.name_ar : item.name_en}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <span className="text-2xl font-bold text-primary/30">
                          {(language === 'ar' ? item.name_ar : item.name_en).charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {language === 'ar' ? item.name_ar : item.name_en}
                    </h3>
                    <p className="text-accent font-medium mt-1">
                      {formatPrice(item.price_sar)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={clearCart}
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 me-2" />
                {language === 'ar' ? 'إفراغ السلة' : 'Clear Cart'}
              </Button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card p-6 rounded-xl border border-border/50 sticky top-24">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                </h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('cart.items')}</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                    <span>{formatPrice(totalPriceSAR)}</span>
                  </div>
                </div>

                {/* Coupon Section */}
                <div className="border-t border-border pt-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-foreground">
                      {language === 'ar' ? 'كوبون الخصم' : 'Discount Code'}
                    </span>
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-accent/10 p-3 rounded-lg">
                      <div>
                        <span className="font-semibold text-accent">{appliedCoupon.code}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {appliedCoupon.discount_type === 'percentage'
                            ? `${appliedCoupon.discount_value}% ${language === 'ar' ? 'خصم' : 'off'}`
                            : `${formatPrice(appliedCoupon.discount_value)} ${language === 'ar' ? 'خصم' : 'off'}`
                          }
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={removeCoupon} className="h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder={language === 'ar' ? 'أدخل رمز الكوبون' : 'Enter code'}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        dir="ltr"
                        className="text-center font-mono"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        variant="outline"
                        className="shrink-0"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'تطبيق' : 'Apply')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-3 space-y-2">
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                      <span>- {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{t('cart.total')}</span>
                    <span className="text-accent">{formatPrice(finalPriceSAR)}</span>
                  </div>
                </div>

                <Link to="/checkout" className="block mt-6">
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                    {t('cart.checkout')}
                    <ArrowIcon className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
