import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface Testimonial {
  id: string;
  name_ar: string;
  name_en: string;
  activity_ar: string | null;
  activity_en: string | null;
  rating: number;
  comment_ar: string;
  comment_en: string;
  avatar_url: string | null;
}

export function TestimonialsSection() {
  const { t, language } = useLanguage();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="testimonials" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mx-auto mb-4" />
              <div className="h-4 bg-muted rounded w-72 mx-auto" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="py-24 bg-secondary/40">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold text-primary tracking-widest uppercase mb-3">{t('testimonials.title')}</span>
          <h2 className="text-3xl lg:text-5xl font-black text-foreground mb-4 font-display">
            <span className="gradient-text">{t('testimonials.subtitle')}</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-card p-6 rounded-2xl border border-border hover:border-primary/40 transition-all hover:shadow-xl hover:-translate-y-1 relative"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < testimonial.rating ? 'text-accent fill-accent' : 'text-muted-foreground/40'}`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{language === 'ar' ? testimonial.comment_ar : testimonial.comment_en}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  {(language === 'ar' ? testimonial.name_ar : testimonial.name_en).charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {language === 'ar' ? testimonial.name_ar : testimonial.name_en}
                  </div>
                  {testimonial.activity_ar && (
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? testimonial.activity_ar : testimonial.activity_en}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
