import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import defaultHero from '@/assets/hero-illustration.jpg';

export function useHeroImage() {
  const [url, setUrl] = useState<string>(defaultHero);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value_json')
        .eq('key', 'hero_image')
        .maybeSingle();
      if (mounted && data?.value_json && typeof data.value_json === 'object' && !Array.isArray(data.value_json)) {
        const json = data.value_json as Record<string, unknown>;
        const customUrl = (json.url as string) || '';
        if (customUrl) setUrl(customUrl);
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { url, loading, defaultUrl: defaultHero };
}
