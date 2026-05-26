import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();

  // Get the redirect path from state, default to checkout
  const from = (location.state as { from?: string })?.from || '/checkout';

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate inputs
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as 'email' | 'password'] = 
            language === 'ar' ? err.message : 
            err.path[0] === 'email' ? 'Invalid email address' : 'Password must be at least 6 characters';
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const { error } = await signIn(email, password);
        
        if (error) {
          toast({
            variant: 'destructive',
            title: language === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login Error',
            description: language === 'ar' 
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
              : 'Invalid email or password',
          });
          return;
        }
      } else {
        const { error } = await signUp(email, password);
        
        if (error) {
          let errorMessage = language === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Error during registration';
          
          if (error.message?.includes('already registered')) {
            errorMessage = language === 'ar' 
              ? 'هذا البريد الإلكتروني مسجل بالفعل' 
              : 'This email is already registered';
          }
          
          toast({
            variant: 'destructive',
            title: language === 'ar' ? 'خطأ في التسجيل' : 'Registration Error',
            description: errorMessage,
          });
          return;
        }

        toast({
          title: language === 'ar' ? 'تم التسجيل بنجاح' : 'Registration Successful',
          description: language === 'ar' 
            ? 'تم إنشاء حسابك بنجاح' 
            : 'Your account has been created successfully',
        });
      }
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {language === 'ar' ? 'تسجيل الدخول للمتابعة' : 'Sign in to Continue'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'سجل دخولك لإتمام عملية الشراء' 
                : 'Sign in to complete your purchase'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">
                  {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </TabsTrigger>
                <TabsTrigger value="signup">
                  {language === 'ar' ? 'حساب جديد' : 'Sign Up'}
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                      className="pl-10 rtl:pl-3 rtl:pr-10"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 rtl:pl-10 rtl:pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 rtl:right-auto rtl:left-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-foreground"></span>
                      {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </span>
                  ) : activeTab === 'login' ? (
                    language === 'ar' ? 'تسجيل الدخول' : 'Sign In'
                  ) : (
                    language === 'ar' ? 'إنشاء حساب' : 'Create Account'
                  )}
                </Button>
              </form>
            </Tabs>

            <div className="mt-6 text-center">
              <Button 
                variant="link" 
                onClick={() => navigate('/cart')}
                className="text-muted-foreground"
              >
                {language === 'ar' ? 'العودة للسلة' : 'Back to Cart'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
