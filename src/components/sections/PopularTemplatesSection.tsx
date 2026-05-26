import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Check, TrendingUp, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PopularTemplate {
  id: string;
  name_ar: string;
  name_en: string;
  price_sar: number;
  preview_image_url: string | null;
  is_free: boolean;
  downloads_count: number | null;
  file_url: string | null;
  discount_percentage: number | null;
  discount_active: boolean | null;
  discount_expires_at: string | null;
}

export function PopularTemplatesSection() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem, isInCart } = useCart();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['popular-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name_ar, name_en, price_sar, preview_image_url, is_free, downloads_count, file_url, discount_percentage, discount_active, discount_expires_at')
        .eq('is_active', true)
        .order('downloads_count', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data as PopularTemplate[];
    },
  });

  if (isLoading || !templates || templates.length === 0) {
    return null;
  }

  const isDiscountValid = (template: PopularTemplate) => {
    if (!template.discount_active || !template.discount_percentage) return false;
    if (!template.discount_expires_at) return true;
    return new Date(template.discount_expires_at) > new Date();
  };

  const calculatePrice = (template: PopularTemplate) => {
    if (isDiscountValid(template) && template.discount_percentage) {
      return template.price_sar - (template.price_sar * template.discount_percentage / 100);
    }
    return template.price_sar;
  };

  const handleFreeDownload = async (template: PopularTemplate) => {
    if (template.file_url) {
      try {
        // Record download event - trigger auto-increments downloads_count
        await supabase.from('template_downloads').insert({
          template_id: template.id,
          user_agent: navigator.userAgent,
        });
      } catch (error) {
        console.error('Error tracking download:', error);
      }
      window.open(template.file_url, '_blank');
    }
  };

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">
              {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {language === 'ar' ? 'النماذج الأكثر تحميلاً' : 'Most Downloaded Templates'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'اكتشف النماذج التي يثق بها آلاف المستخدمين ويعتمدون عليها في أعمالهم'
              : 'Discover the templates that thousands of users trust and rely on for their business'}
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {templates.map((template, index) => {
            const name = language === 'ar' ? template.name_ar : template.name_en;
            const inCart = isInCart(template.id);
            const hasDiscount = isDiscountValid(template);
            const finalPrice = calculatePrice(template);

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
                  
                  {/* Rank Badge */}
                  <Badge className="absolute top-3 start-3 bg-primary text-primary-foreground text-sm font-bold">
                    #{index + 1}
                  </Badge>

                  {/* Downloads Count */}
                  <div className="absolute bottom-3 end-3 bg-background/90 backdrop-blur-sm text-foreground px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    <span>{(template.downloads_count || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Title */}
                  <h3 className="font-semibold text-foreground line-clamp-1">{name}</h3>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    {template.is_free ? (
                      <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                        {language === 'ar' ? 'مجاني' : 'Free'}
                      </Badge>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(finalPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(template.price_sar)}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Action Button */}
                  {template.is_free ? (
                    <Button
                      onClick={() => handleFreeDownload(template)}
                      className="w-full"
                      variant="secondary"
                    >
                      <Download className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'تحميل مجاني' : 'Free Download'}
                    </Button>
                  ) : (
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
                  )}
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
