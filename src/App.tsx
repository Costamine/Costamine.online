import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { CheckoutAuthGuard } from "@/components/checkout/CheckoutAuthGuard";

// Public Pages
import Index from "./pages/Index";
import Templates from "./pages/Templates";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import MyOrders from "./pages/MyOrders";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";
import AnalyticsHub from "./pages/AnalyticsHub";
import AnalyticsExcel from "./pages/AnalyticsExcel";
import AnalyticsLive from "./pages/AnalyticsLive";
import AnalyticsTrialBalance from "./pages/AnalyticsTrialBalance";
import AnalyticsBankRecon from "./pages/AnalyticsBankRecon";
import AnalyticsBankStatement from "./pages/AnalyticsBankStatement";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDownloads from "./pages/admin/AdminDownloads";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminDemoDownloads from "./pages/admin/AdminDemoDownloads";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <CartProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/checkout" element={<CheckoutAuthGuard><Checkout /></CheckoutAuthGuard>} />
                    <Route path="/my-orders" element={<MyOrders />} />
                    <Route path="/unsubscribe" element={<Unsubscribe />} />
                    <Route path="/analytics" element={<AnalyticsHub />} />
                    <Route path="/analytics/excel" element={<AnalyticsExcel />} />
                    <Route path="/analytics/live" element={<AnalyticsLive />} />
                    <Route path="/analytics/trial-balance" element={<AnalyticsTrialBalance />} />
                    <Route path="/analytics/bank-reconciliation" element={<AnalyticsBankRecon />} />
                    <Route path="/analytics/bank-statement" element={<AnalyticsBankStatement />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/templates" element={<ProtectedRoute><AdminTemplates /></ProtectedRoute>} />
                    <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
                    <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
                    <Route path="/admin/contacts" element={<ProtectedRoute><AdminContacts /></ProtectedRoute>} />
                    <Route path="/admin/testimonials" element={<ProtectedRoute><AdminTestimonials /></ProtectedRoute>} />
                    <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                    <Route path="/admin/downloads" element={<ProtectedRoute><AdminDownloads /></ProtectedRoute>} />
                    <Route path="/admin/coupons" element={<ProtectedRoute><AdminCoupons /></ProtectedRoute>} />
                    <Route path="/admin/demo-downloads" element={<ProtectedRoute><AdminDemoDownloads /></ProtectedRoute>} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </CartProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
