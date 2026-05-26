import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useVisitTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    const trackVisit = async () => {
      try {
        const pagePath = window.location.pathname;
        
        await supabase.from('site_visits').insert({
          page_path: pagePath,
          user_agent: navigator.userAgent,
        });
      } catch (error) {
        console.error('Error tracking visit:', error);
      }
    };

    trackVisit();
  }, []);
}
