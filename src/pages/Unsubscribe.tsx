import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MailX, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type Status = 'loading' | 'valid' | 'already_unsubscribed' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus('invalid');
        } else if (data.valid === false && data.reason === 'already_unsubscribed') {
          setStatus('already_unsubscribed');
        } else if (data.valid) {
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      } catch {
        setStatus('error');
      }
    };

    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus('success');
      } else if (data?.reason === 'already_unsubscribed') {
        setStatus('already_unsubscribed');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">جاري التحقق...</p>
            </>
          )}

          {status === 'valid' && (
            <>
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MailX className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">إلغاء الاشتراك</h1>
              <p className="text-muted-foreground mb-8">
                هل أنت متأكد من إلغاء اشتراكك في رسائل البريد الإلكتروني؟
              </p>
              <Button
                onClick={handleUnsubscribe}
                variant="destructive"
                disabled={processing}
                className="gap-2"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                تأكيد إلغاء الاشتراك
              </Button>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">تم إلغاء الاشتراك</h1>
              <p className="text-muted-foreground">لن تتلقى رسائل بريد إلكتروني منا بعد الآن.</p>
            </>
          )}

          {status === 'already_unsubscribed' && (
            <>
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">تم إلغاء الاشتراك مسبقاً</h1>
              <p className="text-muted-foreground">بريدك الإلكتروني غير مشترك بالفعل.</p>
            </>
          )}

          {status === 'invalid' && (
            <>
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">رابط غير صالح</h1>
              <p className="text-muted-foreground">هذا الرابط غير صالح أو منتهي الصلاحية.</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">حدث خطأ</h1>
              <p className="text-muted-foreground">يرجى المحاولة مرة أخرى لاحقاً.</p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
