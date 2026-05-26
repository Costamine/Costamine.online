import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { DiscountedTemplatesSection } from '@/components/sections/DiscountedTemplatesSection';
import { PopularTemplatesSection } from '@/components/sections/PopularTemplatesSection';
import { useVisitTracker } from '@/hooks/useVisitTracker';

const Index = () => {
  // Track site visits
  useVisitTracker();

  return (
    <Layout>
      <HeroSection />
      <DiscountedTemplatesSection />
      <PopularTemplatesSection />
      <FeaturesSection />
      <ServicesSection />
      <TestimonialsSection />
      <ContactSection />
    </Layout>
  );
};

export default Index;
