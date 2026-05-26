import { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { VideoModal } from '@/components/templates/VideoModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

interface Template {
  id: string;
  category_id: string | null;
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
  discount_active: boolean | null;
  discount_expires_at: string | null;
  downloads_count: number | null;
  created_at: string;
  show_new_badge: boolean | null;
  display_location?: string | null;
  show_download_button?: boolean | null;
  show_try_now_button?: boolean | null;
}

export default function TemplatesPage() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'paid'>('all');
  const [loading, setLoading] = useState(true);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, templatesRes] = await Promise.all([
        supabase.from('template_categories').select('*').order('sort_order'),
        supabase.from('templates').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setCategories(categoriesRes.data || []);
      // Only show templates explicitly assigned to the templates page (default)
      setTemplates(
        ((templatesRes.data as any[]) || []).filter(
          (t) => !t.display_location || t.display_location === 'templates'
        )
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    // Category filter
    if (selectedCategory && template.category_id !== selectedCategory) {
      return false;
    }

    // Free/Paid filter
    if (filterType === 'free' && !template.is_free) return false;
    if (filterType === 'paid' && template.is_free) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = (language === 'ar' ? template.name_ar : template.name_en).toLowerCase();
      const desc = (language === 'ar' ? template.description_ar : template.description_en)?.toLowerCase() || '';
      if (!name.includes(query) && !desc.includes(query)) return false;
    }

    return true;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('templates.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('templates.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          {/* Free/Paid Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              size="sm"
            >
              {t('templates.all')}
            </Button>
            <Button
              variant={filterType === 'free' ? 'default' : 'outline'}
              onClick={() => setFilterType('free')}
              size="sm"
              className={filterType === 'free' ? 'bg-success hover:bg-success/90' : ''}
            >
              {t('templates.free')}
            </Button>
            <Button
              variant={filterType === 'paid' ? 'default' : 'outline'}
              onClick={() => setFilterType('paid')}
              size="sm"
              className={filterType === 'paid' ? 'bg-accent hover:bg-accent/90' : ''}
            >
              {t('templates.paid')}
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            {t('templates.all')}
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              size="sm"
            >
              {language === 'ar' ? category.name_ar : category.name_en}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onVideoClick={setVideoModalUrl}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Filter className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">{t('templates.noResults')}</p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={!!videoModalUrl}
        onClose={() => setVideoModalUrl(null)}
        videoUrl={videoModalUrl}
      />
    </Layout>
  );
}
