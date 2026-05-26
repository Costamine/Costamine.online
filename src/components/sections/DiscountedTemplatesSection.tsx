import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { CountdownTimer } from '@/components/templates/CountdownTimer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Check, Percent, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DiscountedTemplate {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price_sar: number;
  preview_image_url: string | null;
  discount_percentage: number | null;
  discount_type: string;
  discount_value: number | null;
  discount_active: boolean | null;
  discount_expires_at: string | null;
  is_free: boolean;
}

export function DiscountedTemplatesSection() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem, isInCart } = useCart();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['discounted-templates'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('templates')
        .select('id, name_ar, name_en, description_ar, description_en, price_sar, preview_image_url, discount_percentage, discount_type, discount_value, discount_active, discount_expires_at, is_free')
        .eq('is_active', true)
        .eq('discount_active', true)
        .eq('is_free', false)
        .gt('discount_expires_at', now)
        .order('discount_percentage', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data as any as DiscountedTemplate[];
    },
  });

  if (isLoading || !templates || templates.length === 0) {
    return null;
  }

  const calculateDiscountedPrice = (template: DiscountedTemplate) => {
    if (template.discount_type === 'fixed') {
      return Math.max(0, template.price_sar - (template.discount_value || 0));
    }
    if (!template.discount_percentage) return template.price_sar;
    return template.price_sar - (template.price_sar * template.discount_percentage / 100);
  };

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <section className="py-16 bg-gradient-to-b from-destructive/5 to-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full mb-4">
            <Percent className="w-5 h-5" />
            <span className="font-semibold">
              {language === 'ar' ? 'عروض محدودة' : 'Limited Offers'}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {language === 'ar' ? 'نماذج بخصومات حصرية' : 'Exclusive Discounted Templates'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'استفد من العروض قبل انتهائها! خصومات مميزة على أفضل النماذج المحاسبية'
              : 'Take advantage of these offers before they expire! Special discounts on the best accounting templates'}
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {templates.map((template) => {
            const name = language === 'ar' ? template.name_ar : template.name_en;
            const inCart = isInCart(template.id);
            const discountedPrice = calculateDiscountedPrice(template);

            return (
              <div
                key={template.id}
                className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Image Container */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={template.preview_image_url || '/placeholder.svg'}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Discount Badge */}
                  <Badge className="absolute top-3 start-3 bg-destructive text-destructive-foreground text-sm font-bold">
                    {`-${template.discount_type === 'fixed'
                      ? Math.round(((template.discount_value || 0) / template.price_sar) * 100)
                      : template.discount_percentage}%`}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Countdown Timer */}
                  {template.discount_expires_at && (
                    <CountdownTimer expiresAt={template.discount_expires_at} />
                  )}

                  {/* Title */}
                  <h3 className="font-semibold text-foreground line-clamp-1">{name}</h3>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(discountedPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(template.price_sar)}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={() => addItem({
                      id: template.id,
                      name_ar: template.name_ar,
                      name_en: template.name_en,
                      price_sar: template.price_sar,
                      preview_image_url: template.preview_image_url || undefined,
                    })}
                    disabled={inCart}
                    className="w-full"
                    variant={inCart ? "secondary" : "default"}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-4 h-4 me-2" />
                        {language === 'ar' ? 'في السلة' : 'In Cart'}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 me-2" />
                        {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link to="/templates">
            <Button variant="outline" size="lg" className="group">
              {language === 'ar' ? 'عرض جميع النماذج' : 'View All Templates'}
              <ArrowIcon className="w-4 h-4 ms-2 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
