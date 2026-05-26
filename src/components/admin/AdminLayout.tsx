import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, ShoppingBag, MessageSquare, Star, Settings, LogOut, Menu, X, FolderTree, Download, Tag, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const { t, direction, language } = useLanguage();
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: t('admin.dashboard') },
    { href: '/admin/templates', icon: FileText, label: t('admin.templates') },
    { href: '/admin/categories', icon: FolderTree, label: t('admin.categories') },
    { href: '/admin/orders', icon: ShoppingBag, label: t('admin.orders') },
    { href: '/admin/contacts', icon: MessageSquare, label: t('admin.contacts') },
    { href: '/admin/testimonials', icon: Star, label: t('admin.testimonials') },
    { href: '/admin/downloads', icon: Download, label: language === 'ar' ? 'تقارير التحميلات' : 'Downloads' },
    { href: '/admin/coupons', icon: Tag, label: language === 'ar' ? 'الكوبونات' : 'Coupons' },
    { href: '/admin/demo-downloads', icon: FileDown, label: language === 'ar' ? 'التحميلات التجريبية' : 'Trial Downloads' },
    { href: '/admin/settings', icon: Settings, label: t('admin.settings') },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleNavClick = () => {
    if (isMobile) {
      setMobileSheetOpen(false);
    }
  };

  const SidebarContent = ({ isSheet = false }: { isSheet?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {(sidebarOpen || isSheet) && (
          <Link to="/admin" className="flex items-center gap-2" onClick={handleNavClick}>
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold">C</span>
            </div>
            <span className="font-bold text-lg text-primary">Costamine</span>
          </Link>
        )}
        {!isSheet && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-primary text-white"
                  : "hover:bg-sidebar-accent text-black dark:text-white"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {(sidebarOpen || isSheet) && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        {(sidebarOpen || isSheet) && user && (
          <p className="text-sm mb-2 truncate text-primary">{user.email}</p>
        )}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start gap-3 text-white bg-primary hover:bg-primary/80",
            !(sidebarOpen || isSheet) && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {(sidebarOpen || isSheet) && <span>{t('admin.logout')}</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen flex", direction === 'rtl' ? 'flex-row-reverse' : '')}>
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar-background border-b border-sidebar-border flex items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold">C</span>
            </div>
            <span className="font-bold text-lg text-white">Costamine</span>
          </Link>
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={direction === 'rtl' ? 'right' : 'left'}
              className="p-0 w-72 bg-sidebar-background border-sidebar-border"
            >
              <SidebarContent isSheet />
            </SheetContent>
          </Sheet>
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "fixed top-0 h-full bg-sidebar-background text-sidebar-foreground transition-all duration-300 z-50",
            sidebarOpen ? "w-64" : "w-16",
            direction === 'rtl' ? 'right-0' : 'left-0'
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          isMobile
            ? "mt-14"
            : sidebarOpen
            ? direction === 'rtl'
              ? 'mr-64'
              : 'ml-64'
            : direction === 'rtl'
            ? 'mr-16'
            : 'ml-16'
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
