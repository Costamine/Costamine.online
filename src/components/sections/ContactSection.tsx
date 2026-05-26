import { useState } from 'react';
import { Send, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { contactFormSchema } from '@/lib/validations';

export function ContactSection() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { contactInfo, workHours, loading: settingsLoading } = useSiteSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data using zod schema
      const validationResult = contactFormSchema.safeParse(formData);
      
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 
          (language === 'ar' ? 'بيانات غير صالحة' : 'Invalid data');
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      const validatedData = validationResult.data;

      const contactId = crypto.randomUUID();
      const { error } = await supabase.from('contacts').insert([{
        id: contactId,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        message: validatedData.message,
      }]);

      if (error) throw error;

      // Send notification
      try {
        const { data: notificationResult } = await supabase.functions.invoke('send-notification', {
          body: {
            type: 'contact',
            data: {
              name: validatedData.name,
              email: validatedData.email,
              phone: validatedData.phone,
              message: validatedData.message,
            },
          },
        });
        
        // If WhatsApp URL is returned, open it in a new tab (for admin)
        if (notificationResult?.whatsappUrl) {
          console.log('WhatsApp notification URL:', notificationResult.whatsappUrl);
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      // Send transactional confirmation email to the user
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'contact-confirmation',
            recipientEmail: validatedData.email,
            idempotencyKey: `contact-confirm-${contactId}`,
            templateData: { name: validatedData.name },
          },
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      toast({
        title: t('contact.success'),
        description: language === 'ar' ? 'سنتواصل معك قريباً' : 'We will contact you soon',
      });

      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact:', error);
      toast({
        title: t('common.error'),
        description: language === 'ar' ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'An error occurred, please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get contact values based on language
  const email = contactInfo?.email || 'info@costamine.com';
  const phone = contactInfo?.phone || '+966 50 000 0000';
  const address = contactInfo ? (language === 'ar' ? contactInfo.address_ar : contactInfo.address_en) || contactInfo.address_ar : (language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia');
  const hours = workHours ? (language === 'ar' ? workHours.hours_ar : workHours.hours_en) || workHours.hours_ar : '';
  // Check if any contact info should be shown
  const showContactInfo = !contactInfo || contactInfo.email_show || contactInfo.phone_show || contactInfo.address_show;
  const showWorkHours = !workHours || workHours.show;
  const showRightColumn = showContactInfo || showWorkHours;

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid-dots opacity-30" />
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold text-primary tracking-widest uppercase mb-3">{t('contact.title')}</span>
          <h2 className="text-3xl lg:text-5xl font-black text-foreground mb-4 font-display">
            <span className="gradient-text">{t('contact.title')}</span>
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className={`grid gap-12 max-w-5xl mx-auto ${showRightColumn ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-2xl'}`}>
          {/* Contact Form */}
          <div className={`bg-card p-8 rounded-2xl border border-border shadow-lg ${!showRightColumn ? 'mx-auto w-full' : ''}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('contact.name')} *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('contact.email')} *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('contact.phone')}
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={language === 'ar' ? 'أدخل رقم جوالك' : 'Enter your phone number'}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('contact.message')} *
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  placeholder={language === 'ar' ? 'اكتب رسالتك هنا' : 'Write your message here'}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground btn-primary-shadow gap-2 h-11"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {t('contact.send')}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            {/* Only show contact info box if at least one item is visible */}
            {(!contactInfo || contactInfo.email_show || contactInfo.phone_show || contactInfo.address_show) && (
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-8 rounded-xl">
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  {t('footer.contactInfo')}
                </h3>
                
                <div className="space-y-6">
                  {(!contactInfo || contactInfo.email_show) && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </div>
                        <a href={`mailto:${email}`} className="text-muted-foreground hover:text-accent transition-colors">
                          {email}
                        </a>
                      </div>
                    </div>
                  )}

                  {(!contactInfo || contactInfo.phone_show) && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                        </div>
                        <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-muted-foreground hover:text-accent transition-colors" dir="ltr">
                          {phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {(!contactInfo || contactInfo.address_show) && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {language === 'ar' ? 'العنوان' : 'Address'}
                        </div>
                        <span className="text-muted-foreground">
                          {address}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Working Hours */}
            {(!workHours || workHours.show) && (
              <div className="bg-card p-6 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-accent" />
                  <h4 className="font-semibold text-foreground">
                    {language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                  </h4>
                </div>
                <div className="text-muted-foreground whitespace-pre-line">
                  {hours || (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'الأحد - الخميس' : 'Sunday - Thursday'}</span>
                        <span dir="ltr">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'الجمعة - السبت' : 'Friday - Saturday'}</span>
                        <span>{language === 'ar' ? 'مغلق' : 'Closed'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
