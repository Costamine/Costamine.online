import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface CheckoutAuthGuardProps {
  children: React.ReactNode;
}

export function CheckoutAuthGuard({ children }: CheckoutAuthGuardProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to auth page with return path
      navigate('/auth', { state: { from: '/checkout' } });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
