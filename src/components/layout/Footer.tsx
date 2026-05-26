import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
export function Footer() {
  const {
    t,
    language
  } = useLanguage();
  const {
    contactInfo
  } = useSiteSettings();
  const currentYear = new Date().getFullYear();

  // Get contact values based on language
  const email = contactInfo?.email || 'info@costamine.com';
  const phone = contactInfo?.phone || '+966 50 000 0000';
  const address = contactInfo ? (language === 'ar' ? contactInfo.address_ar : contactInfo.address_en) || contactInfo.address_ar : language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia';
  const quickLinks = [{
    href: '/#features',
    label: t('nav.features')
  }, {
    href: '/#services',
    label: t('nav.services')
  }, {
    href: '/templates',
    label: t('nav.templates')
  }, {
    href: '/#testimonials',
    label: t('nav.testimonials')
  }, {
    href: '/#contact',
    label: t('nav.contact')
  }];
  return (
    <footer className="relative bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
      <div className="absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 0%, hsl(var(--primary)/0.5), transparent 50%), radial-gradient(circle at 80% 100%, hsl(var(--accent)/0.3), transparent 50%)' }} />
      <div className="container mx-auto px-4 py-14">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-black text-xl">C</span>
              </div>
              <span className="font-display font-black text-xl">Costamine Accounting</span>
            </div>
            <p className="text-sidebar-foreground/70 leading-relaxed text-sm">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 font-display">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2.5">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sidebar-foreground/70 hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 font-display">{t('footer.contactInfo')}</h3>
            <ul className="space-y-3">
              {(!contactInfo || contactInfo.email_show) && (
                <li className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sidebar-foreground/80">{email}</span>
                </li>
              )}
              {(!contactInfo || contactInfo.phone_show) && (
                <li className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sidebar-foreground/80" dir="ltr">{phone}</span>
                </li>
              )}
              {(!contactInfo || contactInfo.address_show) && (
                <li className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sidebar-foreground/80">{address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-sidebar-border/50 mt-10 pt-6 text-center text-sidebar-foreground/60 text-sm">
          © {currentYear} Costamine Accounting. {t('footer.rights')}.
        </div>
      </div>
    </footer>
  );
}