import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContactInfo {
  email: string;
  email_visible: boolean;
  phone: string;
  phone_visible: boolean;
  address_ar: string;
  address_en: string;
  address_visible: boolean;
}

interface WorkHours {
  hours_ar: string;
  hours_en: string;
  show: boolean;
}

// Normalized interface for components
export interface NormalizedContactInfo {
  email: string;
  email_show: boolean;
  phone: string;
  phone_show: boolean;
  address_ar: string;
  address_en: string;
  address_show: boolean;
}

export function useSiteSettings() {
  const [contactInfo, setContactInfo] = useState<NormalizedContactInfo | null>(null);
  const [workHours, setWorkHours] = useState<WorkHours | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .in('key', ['contact_info', 'work_hours']);

        if (error) throw error;

        data?.forEach((setting) => {
          if (setting.key === 'contact_info' && setting.value_json) {
            const raw = setting.value_json as unknown as ContactInfo;
            // Normalize the data structure
            setContactInfo({
              email: raw.email || '',
              email_show: raw.email_visible ?? true,
              phone: raw.phone || '',
              phone_show: raw.phone_visible ?? true,
              address_ar: raw.address_ar || '',
              address_en: raw.address_en || '',
              address_show: raw.address_visible ?? true,
            });
          } else if (setting.key === 'work_hours' && setting.value_json) {
            setWorkHours(setting.value_json as unknown as WorkHours);
          }
        });
      } catch (error) {
        console.error('Error fetching site settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { contactInfo, workHours, loading };
}
