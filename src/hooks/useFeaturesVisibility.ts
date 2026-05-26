import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeaturesVisibility {
  analytics_enabled: boolean;
  analytics_sales_enabled: boolean;
  analytics_smart_enabled: boolean;
  analytics_trial_balance_enabled: boolean;
  analytics_bank_recon_enabled: boolean;
  analytics_bank_statement_enabled: boolean;
}

const DEFAULTS: FeaturesVisibility = {
  analytics_enabled: true,
  analytics_sales_enabled: true,
  analytics_smart_enabled: true,
  analytics_trial_balance_enabled: true,
  analytics_bank_recon_enabled: true,
  analytics_bank_statement_enabled: true,
};

export function useFeaturesVisibility() {
  const [features, setFeatures] = useState<FeaturesVisibility>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value_json')
        .eq('key', 'features_visibility')
        .maybeSingle();
      if (mounted && data?.value_json && typeof data.value_json === 'object' && !Array.isArray(data.value_json)) {
        const json = data.value_json as Record<string, unknown>;
        setFeatures({
          analytics_enabled: json.analytics_enabled !== false,
          analytics_sales_enabled: json.analytics_sales_enabled !== false,
          analytics_smart_enabled: json.analytics_smart_enabled !== false,
          analytics_trial_balance_enabled: json.analytics_trial_balance_enabled !== false,
          analytics_bank_recon_enabled: json.analytics_bank_recon_enabled !== false,
          analytics_bank_statement_enabled: json.analytics_bank_statement_enabled !== false,
        });
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { features, loading };
}
