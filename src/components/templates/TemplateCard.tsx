import { Download, ShoppingCart, Play, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CountdownTimer } from './CountdownTimer';

interface Template {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price_sar: number;
  is_free: boolean;
  file_url: string | null;
  demo_file_url?: string | null;
  preview_image_url: string | null;
  video_url: string | null;
  discount_percentage: number | null;
  discount_type?: string;
  discount_value?: number | null;
  discount_active: boolean | null;
  discount_expires_at: string | null;
  downloads_count?: number;
  created_at?: string;
  show_new_badge?: boolean | null;
  show_download_button?: boolean | null;
  show_try_now_button?: boolean | null;
  display_location?: string | null;
}

interface TemplateCardProps {
  template: Template;
  onVideoClick?: (url: string) => void;
}

export function TemplateCard({ template, onVideoClick }: TemplateCardProps) {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem, removeItem, isInCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const name = language === 'ar' ? template.name_ar : template.name_en;
  const description = language === 'ar' ? template.description_ar : template.description_en;
  const inCart = isInCart(template.id);

  // Check if template is new (created within last 14 days) and show_new_badge is enabled
  const isNewTemplate = () => {
    if (template.show_new_badge === false) return false;
    if (!template.created_at) return false;
    const createdDate = new Date(template.created_at);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return createdDate >= fourteenDaysAgo;
  };

  const showNewBadge = isNewTemplate();

  // "Try Now" opens the template file directly in a new tab
  const showTryNow = template.show_try_now_button === true && !!template.file_url;
  const showDownload = template.show_download_button !== false;

  // Check if discount is still valid (not expired)
  const isDiscountValid = () => {
    if (!template.discount_active) return false;
    const isFixed = template.discount_type === 'fixed';
    const hasValue = isFixed
      ? (template.discount_value && template.discount_value > 0)
      : (template.discount_percentage && template.discount_percentage > 0);
    if (!hasValue) return false;
    if (template.discount_expires_at) {
      return new Date(template.discount_expires_at) > new Date();
    }
    return true;
  };

  const hasDiscount = isDiscountValid();
  const discountedPrice = hasDiscount
    ? template.discount_type === 'fixed'
      ? Math.max(0, template.price_sar - (template.discount_value || 0))
      : template.price_sar * (1 - (template.discount_percentage! / 100))
    : template.price_sar;

  const handleCartAction = () => {
    if (inCart) {
      removeItem(template.id);
    } else {
      addItem({
        id: template.id,
        name_ar: template.name_ar,
        name_en: template.name_en,
        price_sar: discountedPrice,
        preview_image_url: template.preview_image_url || undefined,
      });
    }
  };

  const downloadWithName = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const extension = url.split('.').pop()?.split('?')[0] || 'zip';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleDownload = async () => {
    if (template.file_url) {
      try {
        await supabase.from('template_downloads').insert({
          template_id: template.id,
          user_agent: navigator.userAgent,
        });
      } catch (error) {
        console.error('Error tracking download:', error);
      }
      await downloadWithName(template.file_url, template.name_ar);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden card-hover group">
      {/* Image */}
      <div className="relative aspect-video bg-muted">
        {template.preview_image_url ? (
          <img
            src={template.preview_image_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <span className="text-4xl font-bold text-primary/30">{name.charAt(0)}</span>
          </div>
        )}

        {/* Video Button */}
        {template.video_url && (
          <button
            onClick={() => onVideoClick?.(template.video_url!)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-accent-foreground fill-accent-foreground" />
            </div>
          </button>
        )}

        {/* NEW Badge */}
        {showNewBadge && (
          <Badge className="absolute top-3 end-3 bg-primary text-primary-foreground text-xs font-bold animate-pulse">
            NEW
          </Badge>
        )}

        {/* Discount Badge */}
        {hasDiscount && !template.is_free && (
          <Badge className="absolute top-3 start-3 bg-destructive text-destructive-foreground text-xs">
            <span className="line-through opacity-70 mr-1">{formatPrice(template.price_sar)}</span>
            {`-${template.discount_type === 'fixed'
              ? Math.round(((template.discount_value || 0) / template.price_sar) * 100)
              : template.discount_percentage}%`}
          </Badge>
        )}
      </div>

      {/* Countdown Timer - Below Image */}
      {hasDiscount && !template.is_free && template.discount_expires_at && (
        <div className="px-5 pt-3">
          <CountdownTimer expiresAt={template.discount_expires_at} />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg text-foreground line-clamp-1">
            {name}
          </h3>
          <Badge
            className={cn(
              "shrink-0",
              template.is_free
                ? "bg-success text-success-foreground"
                : "bg-accent text-accent-foreground"
            )}
          >
            {template.is_free ? t('templates.free') : formatPrice(discountedPrice)}
          </Badge>
        </div>
        {description && (
          <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Downloads count */}
        {template.downloads_count !== undefined && template.downloads_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Download className="w-3 h-3" />
            <span>{template.downloads_count} {language === 'ar' ? 'تحميل' : 'downloads'}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {template.is_free && showDownload ? (
            <Button
              onClick={handleDownload}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
              disabled={!template.file_url}
            >
              <Download className="w-4 h-4" />
              {t('templates.download')}
            </Button>
          ) : !template.is_free ? (
            <Button
              onClick={handleCartAction}
              className={cn(
                "flex-1 gap-2",
                inCart
                  ? "bg-accent/20 text-accent hover:bg-accent/30"
                  : "bg-accent hover:bg-accent/90 text-accent-foreground"
              )}
            >
              {inCart ? (
                <>
                  <Check className="w-4 h-4" />
                  {language === 'ar' ? 'في السلة' : 'In Cart'}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  {t('templates.addToCart')}
                </>
              )}
            </Button>
          ) : null}

          {/* Try Now — opens file directly in new tab */}
          {showTryNow && (
            <Button
              onClick={() => window.open(template.file_url!, '_blank', 'noopener,noreferrer')}
              title={language === 'ar' ? 'جرب الآن' : 'Try Now'}
              className={cn(
                "gap-1.5",
                (!template.is_free || !showDownload)
                  ? "flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  : ""
              )}
              variant={(!template.is_free || !showDownload) ? 'default' : 'outline'}
              size={(!template.is_free || !showDownload) ? 'default' : 'sm'}
            >
              <ExternalLink className="w-4 h-4" />
              {language === 'ar' ? 'جرب الآن' : 'Try Now'}
            </Button>
          )}

          {/* Demo/Trial Download for paid templates */}
          {!template.is_free && template.demo_file_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!user) {
                  toast({
                    title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login Required',
                    description: language === 'ar' 
                      ? 'يجب تسجيل الدخول لتحميل النسخة التجريبية' 
                      : 'You must log in to download the trial version',
                    variant: 'destructive',
                  });
                  navigate('/auth');
                  return;
                }
                try {
                  // Check if user already downloaded this demo
                  const { data: existing } = await (supabase as any)
                    .from('demo_downloads')
                    .select('id')
                    .eq('template_id', template.id)
                    .eq('user_id', user.id)
                    .limit(1);

                  if (existing && existing.length > 0) {
                    toast({
                      title: language === 'ar' ? 'تم التحميل مسبقاً' : 'Already Downloaded',
                      description: language === 'ar' 
                        ? 'لقد قمت بتحميل النسخة التجريبية لهذا النموذج من قبل. يُسمح بتحميل واحد فقط لكل نموذج.' 
                        : 'You have already downloaded the trial version of this template. Only one download per template is allowed.',
                      variant: 'destructive',
                    });
                    return;
                  }

                  await (supabase as any).from('demo_downloads').insert({
                    template_id: template.id,
                    user_id: user.id,
                    user_email: user.email || '',
                    user_agent: navigator.userAgent,
                  });
                  // Send admin notification
                  supabase.functions.invoke('send-notification', {
                    body: {
                      type: 'demo_download',
                      data: {
                        template_name: name,
                        user_email: user.email || '',
                      },
                    },
                  }).catch(err => console.error('Notification error:', err));
                } catch (err) {
                  console.error('Error tracking demo download:', err);
                }
                await downloadWithName(template.demo_file_url!, `${template.name_ar} - نسخة تجريبية`);
              }}
              title={language === 'ar' ? 'تحميل النسخة التجريبية' : 'Download Trial'}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" />
              {language === 'ar' ? 'نسخة تجريبية' : 'Trial'}
            </Button>
          )}

          {template.video_url && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onVideoClick?.(template.video_url!)}
              title={t('templates.watchVideo')}
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
