import { useEffect, useState } from 'react';
import { Save, Upload, ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyRate {
  id: string;
  currency: string;
  symbol: string;
  rate_to_sar: number;
}

interface BankInfo {
  bank_name_ar: string;
  bank_name_en: string;
  account_name_ar: string;
  account_name_en: string;
  account_number: string;
  iban: string;
}

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
  visible: boolean;
}

interface HeroStats {
  happy_clients: number;
}

interface NotificationSettings {
  whatsapp_number: string;
  whatsapp_enabled: boolean;
  callmebot_api_key: string;
  email: string;
  email_enabled: boolean;
  resend_api_key: string;
}

interface FeaturesVisibility {
  analytics_enabled: boolean;
  analytics_sales_enabled: boolean;
  analytics_smart_enabled: boolean;
  analytics_trial_balance_enabled: boolean;
  analytics_bank_recon_enabled: boolean;
}

export default function AdminSettings() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bank_name_ar: '',
    bank_name_en: '',
    account_name_ar: '',
    account_name_en: '',
    account_number: '',
    iban: '',
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    email_visible: true,
    phone: '',
    phone_visible: true,
    address_ar: '',
    address_en: '',
    address_visible: true,
  });
  const [workHours, setWorkHours] = useState<WorkHours>({
    hours_ar: '',
    hours_en: '',
    visible: true,
  });
  const [heroStats, setHeroStats] = useState<HeroStats>({
    happy_clients: 1000,
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    whatsapp_number: '0564288002',
    whatsapp_enabled: true,
    callmebot_api_key: '',
    email: 'YOUSSEF@COSTAMINE.COM',
    email_enabled: true,
    resend_api_key: '',
  });
  const [featuresVisibility, setFeaturesVisibility] = useState<FeaturesVisibility>({
    analytics_enabled: true,
    analytics_sales_enabled: true,
    analytics_smart_enabled: true,
    analytics_trial_balance_enabled: true,
    analytics_bank_recon_enabled: true,
  });
  const [heroImageUrl, setHeroImageUrl] = useState<string>('');
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch currency rates
      const { data: currencyData } = await supabase
        .from('currency_rates')
        .select('*')
        .order('currency');

      if (currencyData) setCurrencies(currencyData);

      // Fetch bank info from site_settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'bank_info')
        .maybeSingle();

      if (settingsData?.value_json && typeof settingsData.value_json === 'object' && !Array.isArray(settingsData.value_json)) {
        const json = settingsData.value_json as Record<string, unknown>;
        setBankInfo({
          bank_name_ar: (json.bank_name_ar as string) || '',
          bank_name_en: (json.bank_name_en as string) || '',
          account_name_ar: (json.account_name_ar as string) || '',
          account_name_en: (json.account_name_en as string) || '',
          account_number: (json.account_number as string) || '',
          iban: (json.iban as string) || '',
        });
      }

      // Fetch contact info
      const { data: contactData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'contact_info')
        .maybeSingle();

      if (contactData?.value_json && typeof contactData.value_json === 'object' && !Array.isArray(contactData.value_json)) {
        const json = contactData.value_json as Record<string, unknown>;
        setContactInfo({
          email: (json.email as string) || '',
          email_visible: json.email_visible !== false,
          phone: (json.phone as string) || '',
          phone_visible: json.phone_visible !== false,
          address_ar: (json.address_ar as string) || '',
          address_en: (json.address_en as string) || '',
          address_visible: json.address_visible !== false,
        });
      }

      // Fetch work hours
      const { data: workHoursData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'work_hours')
        .maybeSingle();

      if (workHoursData?.value_json && typeof workHoursData.value_json === 'object' && !Array.isArray(workHoursData.value_json)) {
        const json = workHoursData.value_json as Record<string, unknown>;
        setWorkHours({
          hours_ar: (json.hours_ar as string) || '',
          hours_en: (json.hours_en as string) || '',
          visible: json.visible !== false,
        });
      }

      // Fetch hero stats
      const { data: heroStatsData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'hero_stats')
        .maybeSingle();

      if (heroStatsData?.value_json && typeof heroStatsData.value_json === 'object' && !Array.isArray(heroStatsData.value_json)) {
        const json = heroStatsData.value_json as Record<string, unknown>;
        setHeroStats({
          happy_clients: (json.happy_clients as number) || 1000,
        });
      }

      // Fetch notification settings
      const { data: notificationData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'notification_settings')
        .maybeSingle();

      if (notificationData?.value_json && typeof notificationData.value_json === 'object' && !Array.isArray(notificationData.value_json)) {
        const json = notificationData.value_json as Record<string, unknown>;
        setNotificationSettings({
          whatsapp_number: (json.whatsapp_number as string) || '0564288002',
          whatsapp_enabled: json.whatsapp_enabled !== false,
          callmebot_api_key: (json.callmebot_api_key as string) || '',
          email: (json.email as string) || 'YOUSSEF@COSTAMINE.COM',
          email_enabled: json.email_enabled !== false,
          resend_api_key: (json.resend_api_key as string) || '',
        });
      }

      // Fetch features visibility
      const { data: featuresData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'features_visibility')
        .maybeSingle();

      if (featuresData?.value_json && typeof featuresData.value_json === 'object' && !Array.isArray(featuresData.value_json)) {
        const json = featuresData.value_json as Record<string, unknown>;
        setFeaturesVisibility({
          analytics_enabled: json.analytics_enabled !== false,
          analytics_sales_enabled: json.analytics_sales_enabled !== false,
          analytics_smart_enabled: json.analytics_smart_enabled !== false,
          analytics_trial_balance_enabled: json.analytics_trial_balance_enabled !== false,
          analytics_bank_recon_enabled: json.analytics_bank_recon_enabled !== false,
        });
      }

      // Fetch hero image
      const { data: heroImageData } = await supabase
        .from('site_settings')
        .select('value_json')
        .eq('key', 'hero_image')
        .maybeSingle();
      if (heroImageData?.value_json && typeof heroImageData.value_json === 'object' && !Array.isArray(heroImageData.value_json)) {
        const json = heroImageData.value_json as Record<string, unknown>;
        setHeroImageUrl((json.url as string) || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyChange = (id: string, rate: number) => {
    setCurrencies(currencies.map(c =>
      c.id === id ? { ...c, rate_to_sar: rate } : c
    ));
  };

  const saveCurrencyRates = async () => {
    setIsSaving(true);
    try {
      for (const currency of currencies) {
        const { error } = await supabase
          .from('currency_rates')
          .update({ rate_to_sar: currency.rate_to_sar })
          .eq('id', currency.id);

        if (error) throw error;
      }

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم تحديث أسعار الصرف بنجاح' : 'Currency rates updated successfully',
      });
    } catch (error) {
      console.error('Error saving currency rates:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving currency rates',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveBankInfo = async () => {
    setIsSaving(true);
    try {
      const bankInfoJson = {
        bank_name_ar: bankInfo.bank_name_ar,
        bank_name_en: bankInfo.bank_name_en,
        account_name_ar: bankInfo.account_name_ar,
        account_name_en: bankInfo.account_name_en,
        account_number: bankInfo.account_number,
        iban: bankInfo.iban,
      };

      // Check if setting exists
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'bank_info')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value_json: bankInfoJson })
          .eq('key', 'bank_info');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key: 'bank_info', value_json: bankInfoJson }]);

        if (error) throw error;
      }

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم تحديث معلومات البنك بنجاح' : 'Bank info updated successfully',
      });
    } catch (error) {
      console.error('Error saving bank info:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving bank info',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveContactInfo = async () => {
    setIsSaving(true);
    try {
      const contactInfoJson = {
        email: contactInfo.email,
        email_visible: contactInfo.email_visible,
        phone: contactInfo.phone,
        phone_visible: contactInfo.phone_visible,
        address_ar: contactInfo.address_ar,
        address_en: contactInfo.address_en,
        address_visible: contactInfo.address_visible,
      };

      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'contact_info')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value_json: contactInfoJson })
          .eq('key', 'contact_info');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key: 'contact_info', value_json: contactInfoJson }]);

        if (error) throw error;
      }

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم تحديث معلومات التواصل بنجاح' : 'Contact info updated successfully',
      });
    } catch (error) {
      console.error('Error saving contact info:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving contact info',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveWorkHours = async () => {
    setIsSaving(true);
    try {
      const workHoursJson = {
        hours_ar: workHours.hours_ar,
        hours_en: workHours.hours_en,
        visible: workHours.visible,
      };

      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'work_hours')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value_json: workHoursJson })
          .eq('key', 'work_hours');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key: 'work_hours', value_json: workHoursJson }]);

        if (error) throw error;
      }

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم تحديث ساعات العمل بنجاح' : 'Work hours updated successfully',
      });
    } catch (error) {
      console.error('Error saving work hours:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving work hours',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveHeroStats = async () => {
    setIsSaving(true);
    try {
      const heroStatsJson = {
        happy_clients: heroStats.happy_clients,
      };

      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'hero_stats')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value_json: heroStatsJson })
          .eq('key', 'hero_stats');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key: 'hero_stats', value_json: heroStatsJson }]);

        if (error) throw error;
      }

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم تحديث إحصائيات الصفحة الرئيسية بنجاح' : 'Hero stats updated successfully',
      });
    } catch (error) {
      console.error('Error saving hero stats:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving hero stats',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    setIsSaving(true);
    try {
      const notificationSettingsJson = {
        whatsapp_number: notificationSettings.whatsapp_number,
        whatsapp_enabled: notificationSettings.whatsapp_enabled,
        callmebot_api_key: notificationSettings.callmebot_api_key,
        email: notificationSettings.email,
        email_enabled: notificationSettings.email_enabled,
        resend_api_key: notificationSettings.resend_api_key,
      };

      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'notification_settings')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value_json: notificationSettingsJson })
          .eq('key', 'notification_settings');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key: 'notification_settings', value_json: notificationSettingsJson }]);

        if (error) throw error;
      }

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم تحديث إعدادات الإشعارات بنجاح' : 'Notification settings updated successfully',
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving notification settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveFeaturesVisibility = async () => {
    setIsSaving(true);
    try {
      const json = {
        analytics_enabled: featuresVisibility.analytics_enabled,
        analytics_sales_enabled: featuresVisibility.analytics_sales_enabled,
        analytics_smart_enabled: featuresVisibility.analytics_smart_enabled,
        analytics_trial_balance_enabled: featuresVisibility.analytics_trial_balance_enabled,
        analytics_bank_recon_enabled: featuresVisibility.analytics_bank_recon_enabled,
      };
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'features_visibility')
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value_json: json })
          .eq('key', 'features_visibility');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key: 'features_visibility', value_json: json }]);
        if (error) throw error;
      }
      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم تحديث إعدادات الميزات بنجاح' : 'Features visibility updated successfully',
      });
    } catch (error) {
      console.error('Error saving features visibility:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving features visibility',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const uploadHeroImage = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'الملف كبير' : 'File too large',
        description: language === 'ar' ? 'الحد الأقصى 5 ميجابايت' : 'Max size is 5MB',
      });
      return;
    }
    setIsUploadingHero(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `hero-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('hero-assets')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('hero-assets').getPublicUrl(path);
      const newUrl = pub.publicUrl;

      const json = { url: newUrl };
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'hero_image')
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value_json: json }).eq('key', 'hero_image');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert([{ key: 'hero_image', value_json: json }]);
        if (error) throw error;
      }
      setHeroImageUrl(newUrl);
      toast({
        title: language === 'ar' ? 'تم الرفع' : 'Uploaded',
        description: language === 'ar' ? 'تم تحديث صورة الهبوط بنجاح' : 'Hero image updated successfully',
      });
    } catch (error: any) {
      console.error('Error uploading hero image:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error?.message || (language === 'ar' ? 'حدث خطأ أثناء الرفع' : 'Upload failed'),
      });
    } finally {
      setIsUploadingHero(false);
    }
  };

  const resetHeroImage = async () => {
    setIsUploadingHero(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'hero_image')
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value_json: { url: '' } }).eq('key', 'hero_image');
        if (error) throw error;
      }
      setHeroImageUrl('');
      toast({
        title: language === 'ar' ? 'تم' : 'Done',
        description: language === 'ar' ? 'تمت إعادة الصورة الافتراضية' : 'Default image restored',
      });
    } catch (error) {
      console.error('Error resetting hero image:', error);
    } finally {
      setIsUploadingHero(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' ? 'إدارة إعدادات الموقع' : 'Manage site settings'}
          </p>
        </div>

        <Tabs defaultValue="currencies" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="currencies" className="text-xs sm:text-sm">
              {language === 'ar' ? 'أسعار الصرف' : 'Currency Rates'}
            </TabsTrigger>
            <TabsTrigger value="bank" className="text-xs sm:text-sm">
              {language === 'ar' ? 'معلومات البنك' : 'Bank Info'}
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm">
              {language === 'ar' ? 'معلومات التواصل' : 'Contact Info'}
            </TabsTrigger>
            <TabsTrigger value="hours" className="text-xs sm:text-sm">
              {language === 'ar' ? 'ساعات العمل' : 'Work Hours'}
            </TabsTrigger>
            <TabsTrigger value="hero" className="text-xs sm:text-sm">
              {language === 'ar' ? 'إحصائيات' : 'Hero Stats'}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">
              {language === 'ar' ? 'الإشعارات' : 'Notifications'}
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs sm:text-sm">
              {language === 'ar' ? 'الميزات' : 'Features'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="currencies">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'أسعار صرف العملات' : 'Currency Exchange Rates'}</CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'تحديد سعر صرف كل عملة مقابل الريال السعودي'
                    : 'Set the exchange rate for each currency against SAR'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currencies.map((currency) => (
                  <div key={currency.id} className="flex items-center gap-4">
                    <div className="w-20 font-medium">
                      {currency.symbol} {currency.currency}
                    </div>
                    <div className="flex-1 max-w-xs">
                      <Label className="text-sm text-muted-foreground">
                        {language === 'ar' ? '1 ر.س =' : '1 SAR ='}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={currency.rate_to_sar}
                        onChange={(e) => handleCurrencyChange(currency.id, Number(e.target.value))}
                        disabled={currency.currency === 'SAR'}
                      />
                    </div>
                    <span className="text-muted-foreground">{currency.currency}</span>
                  </div>
                ))}

                <Button onClick={saveCurrencyRates} disabled={isSaving} className="mt-4 gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'معلومات الحساب البنكي' : 'Bank Account Info'}</CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'معلومات الحساب البنكي التي تظهر في صفحة الدفع'
                    : 'Bank account information shown on checkout page'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'اسم البنك (عربي)' : 'Bank Name (Arabic)'}</Label>
                    <Input
                      value={bankInfo.bank_name_ar}
                      onChange={(e) => setBankInfo({ ...bankInfo, bank_name_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'اسم البنك (إنجليزي)' : 'Bank Name (English)'}</Label>
                    <Input
                      value={bankInfo.bank_name_en}
                      onChange={(e) => setBankInfo({ ...bankInfo, bank_name_en: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'اسم صاحب الحساب (عربي)' : 'Account Name (Arabic)'}</Label>
                    <Input
                      value={bankInfo.account_name_ar}
                      onChange={(e) => setBankInfo({ ...bankInfo, account_name_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'اسم صاحب الحساب (إنجليزي)' : 'Account Name (English)'}</Label>
                    <Input
                      value={bankInfo.account_name_en}
                      onChange={(e) => setBankInfo({ ...bankInfo, account_name_en: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'رقم الحساب' : 'Account Number'}</Label>
                    <Input
                      value={bankInfo.account_number}
                      onChange={(e) => setBankInfo({ ...bankInfo, account_number: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'رقم الآيبان' : 'IBAN'}</Label>
                    <Input
                      value={bankInfo.iban}
                      onChange={(e) => setBankInfo({ ...bankInfo, iban: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                </div>

                <Button onClick={saveBankInfo} disabled={isSaving} className="mt-4 gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}</CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'معلومات التواصل التي تظهر في الموقع'
                    : 'Contact information displayed on the website'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="email_visible"
                        checked={contactInfo.email_visible}
                        onCheckedChange={(checked) => setContactInfo({ ...contactInfo, email_visible: checked as boolean })}
                      />
                      <Label htmlFor="email_visible" className="text-sm text-muted-foreground cursor-pointer">
                        {language === 'ar' ? 'إظهار' : 'Visible'}
                      </Label>
                    </div>
                  </div>
                  <Input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    placeholder="info@example.com"
                    dir="ltr"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="phone_visible"
                        checked={contactInfo.phone_visible}
                        onCheckedChange={(checked) => setContactInfo({ ...contactInfo, phone_visible: checked as boolean })}
                      />
                      <Label htmlFor="phone_visible" className="text-sm text-muted-foreground cursor-pointer">
                        {language === 'ar' ? 'إظهار' : 'Visible'}
                      </Label>
                    </div>
                  </div>
                  <Input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    placeholder="+966 xx xxx xxxx"
                    dir="ltr"
                  />
                </div>

                {/* Address */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">{language === 'ar' ? 'العنوان' : 'Address'}</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="address_visible"
                        checked={contactInfo.address_visible}
                        onCheckedChange={(checked) => setContactInfo({ ...contactInfo, address_visible: checked as boolean })}
                      />
                      <Label htmlFor="address_visible" className="text-sm text-muted-foreground cursor-pointer">
                        {language === 'ar' ? 'إظهار' : 'Visible'}
                      </Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{language === 'ar' ? 'العنوان (عربي)' : 'Address (Arabic)'}</Label>
                      <Input
                        value={contactInfo.address_ar}
                        onChange={(e) => setContactInfo({ ...contactInfo, address_ar: e.target.value })}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{language === 'ar' ? 'العنوان (إنجليزي)' : 'Address (English)'}</Label>
                      <Input
                        value={contactInfo.address_en}
                        onChange={(e) => setContactInfo({ ...contactInfo, address_en: e.target.value })}
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={saveContactInfo} disabled={isSaving} className="mt-4 gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'ساعات العمل' : 'Work Hours'}</CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'أوقات العمل التي تظهر في الموقع'
                    : 'Working hours displayed on the website'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">{language === 'ar' ? 'إظهار ساعات العمل' : 'Show Work Hours'}</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hours_visible"
                      checked={workHours.visible}
                      onCheckedChange={(checked) => setWorkHours({ ...workHours, visible: checked as boolean })}
                    />
                    <Label htmlFor="hours_visible" className="text-sm text-muted-foreground cursor-pointer">
                      {language === 'ar' ? 'إظهار' : 'Visible'}
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'ساعات العمل (عربي)' : 'Work Hours (Arabic)'}</Label>
                    <Input
                      value={workHours.hours_ar}
                      onChange={(e) => setWorkHours({ ...workHours, hours_ar: e.target.value })}
                      placeholder="السبت - الخميس: 9 ص - 6 م"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'ساعات العمل (إنجليزي)' : 'Work Hours (English)'}</Label>
                    <Input
                      value={workHours.hours_en}
                      onChange={(e) => setWorkHours({ ...workHours, hours_en: e.target.value })}
                      placeholder="Sat - Thu: 9 AM - 6 PM"
                      dir="ltr"
                    />
                  </div>
                </div>

                <Button onClick={saveWorkHours} disabled={isSaving} className="mt-4 gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'إحصائيات الصفحة الرئيسية' : 'Hero Stats'}</CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'الأرقام التي تظهر في الصفحة الرئيسية (عدد النماذج يتم جلبه تلقائياً من قاعدة البيانات)'
                    : 'Statistics displayed on the home page (templates count is fetched automatically from database)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    {language === 'ar' ? 'عدد العملاء الراضين' : 'Happy Clients Count'}
                  </Label>
                  <Input
                    type="number"
                    value={heroStats.happy_clients}
                    onChange={(e) => setHeroStats({ ...heroStats, happy_clients: Number(e.target.value) })}
                    placeholder="1000"
                    dir="ltr"
                  />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'سيظهر هذا الرقم في قسم الإحصائيات بالصفحة الرئيسية'
                      : 'This number will be displayed in the stats section on the home page'}
                  </p>
                </div>

                <Button onClick={saveHeroStats} disabled={isSaving} className="mt-4 gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}</CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'استلم إشعارات عند وصول طلبات أو رسائل جديدة'
                    : 'Receive notifications when new orders or messages arrive'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* WhatsApp Settings */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <span>📱</span>
                      {language === 'ar' ? 'إشعارات واتساب' : 'WhatsApp Notifications'}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="whatsapp_enabled"
                        checked={notificationSettings.whatsapp_enabled}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, whatsapp_enabled: checked as boolean })}
                      />
                      <Label htmlFor="whatsapp_enabled" className="text-sm text-muted-foreground cursor-pointer">
                        {language === 'ar' ? 'تفعيل' : 'Enable'}
                      </Label>
                    </div>
                  </div>
                  <Input
                    type="tel"
                    value={notificationSettings.whatsapp_number}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, whatsapp_number: e.target.value })}
                    placeholder="0564288002"
                    dir="ltr"
                    disabled={!notificationSettings.whatsapp_enabled}
                  />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'رقم الواتساب الذي ستستلم عليه الإشعارات (بالصيغة الدولية مثل 966564288002)'
                      : 'WhatsApp number to receive notifications (international format e.g. 966564288002)'}
                  </p>
                  <div className="space-y-2 mt-3">
                    <Label className="text-sm font-medium">
                      {language === 'ar' ? 'مفتاح TextMeBot API' : 'TextMeBot API Key'}
                    </Label>
                    <Input
                      type="password"
                      value={notificationSettings.callmebot_api_key}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, callmebot_api_key: e.target.value })}
                      placeholder="ht79jNcxfsjF"
                      dir="ltr"
                    />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' 
                        ? 'احصل على مفتاح API من textmebot.com وقم بربط رقمك'
                        : 'Get your API key from textmebot.com and link your number'}
                    </p>
                  </div>
                </div>

                {/* Email Settings */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <span>📧</span>
                      {language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="email_enabled"
                        checked={notificationSettings.email_enabled}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, email_enabled: checked as boolean })}
                      />
                      <Label htmlFor="email_enabled" className="text-sm text-muted-foreground cursor-pointer">
                        {language === 'ar' ? 'تفعيل' : 'Enable'}
                      </Label>
                    </div>
                  </div>
                  <Input
                    type="email"
                    value={notificationSettings.email}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, email: e.target.value })}
                    placeholder="YOUSSEF@COSTAMINE.COM"
                    dir="ltr"
                    disabled={!notificationSettings.email_enabled}
                  />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'البريد الإلكتروني الذي ستستلم عليه الإشعارات'
                      : 'Email address to receive notifications'}
                  </p>
                </div>

                {/* Resend API Key Settings */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <span>🔑</span>
                    {language === 'ar' ? 'مفتاح API لخدمة Resend' : 'Resend API Key'}
                  </Label>
                  <Input
                    type="password"
                    value={notificationSettings.resend_api_key}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, resend_api_key: e.target.value })}
                    placeholder="re_xxxxxxxxxx"
                    dir="ltr"
                  />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'يمكنك الحصول على مفتاح API من resend.com - مطلوب لإرسال الإيميلات'
                      : 'Get your API key from resend.com - required for sending emails'}
                  </p>
                </div>

                <Button onClick={saveNotificationSettings} disabled={isSaving} className="mt-4 gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'إعدادات الميزات' : 'Features Visibility'}</CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'تحكم في إظهار أو إخفاء بعض الميزات من صفحة الهبوط'
                    : 'Control which features appear on the landing page'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      {language === 'ar' ? 'تحليل البيانات (/analytics)' : 'Data Analysis (/analytics)'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar'
                        ? 'إظهار أو إخفاء رابط تحليل البيانات في القائمة الرئيسية'
                        : 'Show or hide the Data Analysis link in the main navigation'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="analytics_enabled"
                      checked={featuresVisibility.analytics_enabled}
                      onCheckedChange={(checked) =>
                        setFeaturesVisibility({ ...featuresVisibility, analytics_enabled: checked as boolean })
                      }
                    />
                    <Label htmlFor="analytics_enabled" className="text-sm text-muted-foreground cursor-pointer">
                      {language === 'ar' ? 'مفعّل' : 'Enabled'}
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    {language === 'ar' ? 'لوحات التحليلات المتاحة' : 'Available Analytics Dashboards'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar'
                      ? 'تحكم في إظهار كل داشبورد داخل صفحة /analytics'
                      : 'Control which dashboards appear inside /analytics page'}
                  </p>

                  {[
                    { key: 'analytics_sales_enabled', ar: 'داشبورد تحليل المبيعات', en: 'Sales Analytics Dashboard' },
                    { key: 'analytics_smart_enabled', ar: 'التحليل الذكي الشامل', en: 'Universal Smart Analytics' },
                    { key: 'analytics_trial_balance_enabled', ar: 'ميزان المراجعة → القوائم المالية', en: 'Trial Balance → Financials' },
                    { key: 'analytics_bank_recon_enabled', ar: 'المطابقة البنكية', en: 'Bank Reconciliation' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <Label htmlFor={item.key} className="cursor-pointer">
                        {language === 'ar' ? item.ar : item.en}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={item.key}
                          checked={(featuresVisibility as any)[item.key]}
                          onCheckedChange={(checked) =>
                            setFeaturesVisibility({ ...featuresVisibility, [item.key]: checked as boolean })
                          }
                        />
                        <Label htmlFor={item.key} className="text-sm text-muted-foreground cursor-pointer">
                          {language === 'ar' ? 'مفعّل' : 'Enabled'}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={saveFeaturesVisibility} disabled={isSaving} className="mt-4 gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>

                {/* Hero Image Manager */}
                <div className="space-y-3 pt-6 border-t">
                  <div>
                    <Label className="text-base font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      {language === 'ar' ? 'صورة الصفحة الرئيسية' : 'Hero Image'}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'ar'
                        ? 'الصورة المعروضة بجانب العنوان الرئيسي في صفحة الهبوط (الحد الأقصى 5MB، يُفضّل صورة مربعة)'
                        : 'Image shown next to the main headline on the landing page (max 5MB, square preferred)'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-40 h-40 rounded-xl border bg-muted/40 overflow-hidden flex items-center justify-center shrink-0">
                      {heroImageUrl ? (
                        <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xs text-muted-foreground text-center px-2">
                          {language === 'ar' ? 'الصورة الافتراضية مُستخدمة' : 'Using default image'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        id="hero-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadHeroImage(f);
                          e.target.value = '';
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('hero-image-upload')?.click()}
                        disabled={isUploadingHero}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingHero
                          ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                          : (language === 'ar' ? 'رفع صورة جديدة' : 'Upload New Image')}
                      </Button>
                      {heroImageUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetHeroImage}
                          disabled={isUploadingHero}
                          className="gap-2 ms-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {language === 'ar' ? 'استعادة الافتراضية' : 'Restore Default'}
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar'
                          ? 'الصيغ المدعومة: JPG, PNG, WebP'
                          : 'Supported formats: JPG, PNG, WebP'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
