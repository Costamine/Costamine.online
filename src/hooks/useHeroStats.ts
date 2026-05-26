import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HeroStats {
  templatesCount: number;
  happyClients: number;
}

export function useHeroStats() {
  const [stats, setStats] = useState<HeroStats>({ templatesCount: 0, happyClients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch templates count from database
        const { count: templatesCount } = await supabase
          .from('templates')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Fetch happy clients count from site_settings
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('value_json')
          .eq('key', 'hero_stats')
          .maybeSingle();

        let happyClients = 1000; // default value
        if (settingsData?.value_json && typeof settingsData.value_json === 'object') {
          const json = settingsData.value_json as Record<string, unknown>;
          happyClients = (json.happy_clients as number) || 1000;
        }

        setStats({
          templatesCount: templatesCount || 0,
          happyClients,
        });
      } catch (error) {
        console.error('Error fetching hero stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}
