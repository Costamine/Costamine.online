import { FileSpreadsheet, Layout, HeadphonesIcon, RefreshCw, Shield, Languages } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    { icon: FileSpreadsheet, title: t('features.professional.title'), description: t('features.professional.desc'), tint: 'from-teal-500/20 to-cyan-500/10' },
    { icon: Layout, title: t('features.easy.title'), description: t('features.easy.desc'), tint: 'from-cyan-500/20 to-blue-500/10' },
    { icon: HeadphonesIcon, title: t('features.support.title'), description: t('features.support.desc'), tint: 'from-amber-500/20 to-orange-500/10' },
    { icon: RefreshCw, title: t('features.updates.title'), description: t('features.updates.desc'), tint: 'from-emerald-500/20 to-teal-500/10' },
    { icon: Shield, title: t('features.secure.title'), description: t('features.secure.desc'), tint: 'from-rose-500/20 to-pink-500/10' },
    { icon: Languages, title: t('features.arabic.title'), description: t('features.arabic.desc'), tint: 'from-indigo-500/20 to-purple-500/10' },
  ];

  return (
    <section id="features" className="relative py-24 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid-dots opacity-40" />
      <div className="container mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }} className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold text-primary tracking-widest uppercase mb-3">{t('features.title')}</span>
          <h2 className="text-3xl lg:text-5xl font-black text-foreground mb-4 font-display">
            {t('features.subtitle')}
          </h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp} whileHover={{ y: -4 }} className="group relative rounded-2xl border border-border bg-card backdrop-blur-md p-6 hover:border-primary/40 transition-all overflow-hidden shadow-sm hover:shadow-xl">
              <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${f.tint} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-shadow">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-foreground font-bold text-lg mb-2 font-display">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
