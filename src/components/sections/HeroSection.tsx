import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHeroStats } from '@/hooks/useHeroStats';
import { useHeroImage } from '@/hooks/useHeroImage';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function HeroVisual({ isRTL }: { isRTL: boolean }) {
  const t = (en: string, ar: string) => (isRTL ? ar : en);
  const { url } = useHeroImage();

  return (
    <div className="relative max-w-[560px] mx-auto">
      {/* Ambient blobs */}
      <div className="absolute -inset-10 bg-gradient-to-tr from-primary/25 via-accent/10 to-primary/25 blur-3xl rounded-full -z-10" />
      <div className="absolute top-10 -right-6 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse -z-10" />
      <div className="absolute -bottom-4 -left-6 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse -z-10" style={{ animationDelay: '1.5s' }} />

      {/* Main image card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-card to-muted/40 border border-border/60 shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.35)]"
      >
        <img
          src={url}
          alt={t('Costamine accounting dashboard illustration', 'صورة توضيحية لداشبورد محاسبة كوستامين')}
          width={1024}
          height={1024}
          className="w-full h-auto object-cover aspect-square"
        />
        {/* Gradient overlay for blend with background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
      </motion.div>

      {/* Floating chips */}
    </div>
  );
}

export function HeroSection() {
  const { t, direction, language } = useLanguage();
  const { stats } = useHeroStats();
  const isRTL = direction === 'rtl';
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const tt = (en: string, ar: string) => (isRTL ? ar : en);

  const formatNumber = (num: number) => {
    if (num >= 1000) return `+${Math.floor(num / 1000)}K`;
    return `+${num}`;
  };

  return (
    <section className="relative min-h-[90vh] flex items-center pt-16 pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 -z-10 gradient-hero" />
      <div className="absolute inset-0 -z-10 bg-grid-dots opacity-60" />
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div initial="hidden" animate="show" variants={stagger} className={isRTL ? 'text-right' : 'text-left'}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent">{tt('New:', 'جديد:')}</span>
            <span>{tt('Smart Excel analytics', 'تحليل ذكي لملفات Excel')}</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.15] text-foreground mb-6 font-display">
            {isRTL ? (
              <>حلول محاسبية{' '}<span className="gradient-text">متكاملة</span><br />لنجاح أعمالك</>
            ) : (
              <>Integrated{' '}<span className="gradient-text">accounting solutions</span><br />for your business success</>
            )}
          </motion.h1>

          <motion.p variants={fadeUp} className="text-muted-foreground text-base lg:text-lg mb-10 max-w-xl leading-relaxed">
            {t('hero.subtitle')}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <Link to="/templates">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground btn-primary-shadow text-base px-7 h-12">
                {t('hero.cta.templates')}
                <Arrow className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#contact">
              <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/5 text-base px-7 h-12">
                {t('hero.cta.contact')}
              </Button>
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> {tt('Bilingual AR/EN', 'عربي/إنجليزي')}</div>
            <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> {tt('Multi-currency', 'متعدد العملات')}</div>
            <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> {tt('24/7 Arabic support', 'دعم عربي 24/7')}</div>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border/60">
            <div>
              <div className="text-2xl md:text-3xl font-black gradient-text">{formatNumber(stats.templatesCount)}</div>
              <div className="text-xs text-muted-foreground mt-1">{language === 'ar' ? 'نموذج احترافي' : 'Professional Templates'}</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black gradient-text">{formatNumber(stats.happyClients)}</div>
              <div className="text-xs text-muted-foreground mt-1">{language === 'ar' ? 'عميل راضٍ' : 'Happy Clients'}</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black gradient-text">24/7</div>
              <div className="text-xs text-muted-foreground mt-1">{language === 'ar' ? 'دعم فني' : 'Support'}</div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <HeroVisual isRTL={isRTL} />
        </motion.div>
      </div>
    </section>
  );
}
