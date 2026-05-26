import { Calculator, TrendingUp, Package, Users, FileText, BarChart3 } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export function ServicesSection() {
  const { t, language } = useLanguage();

  const services = [
    {
      icon: Calculator,
      title_ar: 'المحاسبة المالية',
      title_en: 'Financial Accounting',
      description_ar: 'نماذج شاملة للقوائم المالية والتقارير المحاسبية',
      description_en: 'Comprehensive templates for financial statements and accounting reports',
    },
    {
      icon: TrendingUp,
      title_ar: 'محاسبة التكاليف',
      title_en: 'Cost Accounting',
      description_ar: 'نماذج لحساب وتحليل التكاليف وتسعير المنتجات',
      description_en: 'Templates for cost calculation, analysis and product pricing',
    },
    {
      icon: Package,
      title_ar: 'إدارة المخازن',
      title_en: 'Inventory Management',
      description_ar: 'نماذج لإدارة المخزون وحركة البضائع',
      description_en: 'Templates for inventory management and goods movement',
    },
    {
      icon: Users,
      title_ar: 'الموارد البشرية',
      title_en: 'Human Resources',
      description_ar: 'نماذج لإدارة الرواتب وشؤون الموظفين',
      description_en: 'Templates for payroll and employee affairs management',
    },
    {
      icon: FileText,
      title_ar: 'الضرائب والزكاة',
      title_en: 'Taxes & Zakat',
      description_ar: 'نماذج لحساب الضرائب والزكاة والتقارير الضريبية',
      description_en: 'Templates for tax and zakat calculations and reports',
    },
    {
      icon: BarChart3,
      title_ar: 'التقارير الإدارية',
      title_en: 'Management Reports',
      description_ar: 'نماذج للتقارير الإدارية وتحليل الأداء',
      description_en: 'Templates for management reports and performance analysis',
    },
  ];

  return (
    <section id="services" className="relative py-24 px-4 sm:px-6 bg-secondary/40">
      <div className="container mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold text-primary tracking-widest uppercase mb-3">{t('services.title')}</span>
          <h2 className="text-3xl lg:text-5xl font-black text-foreground mb-4 font-display">
            <span className="gradient-text">{t('services.subtitle')}</span>
          </h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div key={index} variants={fadeUp} whileHover={{ y: -4 }} className="relative p-6 rounded-2xl bg-card border border-border hover:border-primary/40 group overflow-hidden transition-all shadow-sm hover:shadow-xl">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <service.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 font-display">
                  {language === 'ar' ? service.title_ar : service.title_en}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {language === 'ar' ? service.description_ar : service.description_en}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
