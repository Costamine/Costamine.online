import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, Moon, Sun, Globe, User, LogOut, Package, BarChart3 } from 'lucide-react';
import costamineLogo from '@/assets/costamine-logo.jpeg';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency, Currency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFeaturesVisibility } from '@/hooks/useFeaturesVisibility';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t, direction } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const { features } = useFeaturesVisibility();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { href: '/#features', label: t('nav.features') },
    { href: '/#services', label: t('nav.services') },
    { href: '/templates', label: t('nav.templates') },
    ...(features.analytics_enabled
      ? [{ href: '/analytics', label: language === 'ar' ? 'تحليل البيانات' : 'Data Analysis' }]
      : []),
    { href: '/#testimonials', label: t('nav.testimonials') },
    { href: '/#contact', label: t('nav.contact') },
  ];

  const currencies: Currency[] = ['SAR', 'USD', 'EGP'];

  const scrollToSection = (href: string) => {
    if (href.startsWith('/#')) {
      const sectionId = href.replace('/#', '');
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={costamineLogo} 
              alt="Costamine Logo" 
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={(e) => {
                  if (link.href.startsWith('/#')) {
                    e.preventDefault();
                    if (location.pathname !== '/') {
                      window.location.href = link.href;
                    } else {
                      scrollToSection(link.href);
                    }
                  }
                }}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              <Globe className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            {/* Currency Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="font-medium">
                  {currency}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'}>
                {currencies.map((curr) => (
                  <DropdownMenuItem
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={cn(currency === curr && 'bg-accent/10')}
                  >
                    {curr}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Auth Button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'}>
                  <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                    <Package className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'طلباتي' : 'My Orders'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { signOut(); navigate('/'); }}>
                    <LogOut className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="gap-1">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </span>
                </Button>
              </Link>
            )}

            {/* CTA Button - Desktop */}
            <Link to="/templates" className="hidden md:block">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground btn-primary-shadow">
                {t('nav.browseTemplates')}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={(e) => {
                    if (link.href.startsWith('/#')) {
                      e.preventDefault();
                      if (location.pathname !== '/') {
                        window.location.href = link.href;
                      } else {
                        scrollToSection(link.href);
                      }
                    } else {
                      setIsOpen(false);
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/templates" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground btn-primary-shadow">
                  {t('nav.browseTemplates')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
