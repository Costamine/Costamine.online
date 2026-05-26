
-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create template_categories table
CREATE TABLE public.template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table
CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.template_categories(id) ON DELETE SET NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    price_sar DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_egp DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_free BOOLEAN NOT NULL DEFAULT false,
    file_url TEXT,
    preview_image_url TEXT,
    video_url TEXT,
    downloads_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    total_sar DECIMAL(10,2) NOT NULL,
    total_usd DECIMAL(10,2) NOT NULL,
    total_egp DECIMAL(10,2) NOT NULL,
    currency_used TEXT NOT NULL DEFAULT 'SAR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'completed', 'cancelled')),
    transfer_proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    template_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table for contact form submissions
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create testimonials table
CREATE TABLE public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    activity_ar TEXT,
    activity_en TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment_ar TEXT NOT NULL,
    comment_en TEXT NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_settings table for dynamic content
CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value_ar TEXT,
    value_en TEXT,
    value_json JSONB,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create currency_rates table
CREATE TABLE public.currency_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency TEXT UNIQUE NOT NULL,
    rate_to_sar DECIMAL(10,4) NOT NULL DEFAULT 1,
    symbol TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Public read policies for templates and categories
CREATE POLICY "Anyone can view categories" ON public.template_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view active templates" ON public.templates FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active testimonials" ON public.testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can view currency rates" ON public.currency_rates FOR SELECT USING (true);

-- Public can submit contacts and orders
CREATE POLICY "Anyone can submit contact form" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Admin policies for full access
CREATE POLICY "Admins can manage categories" ON public.template_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage templates" ON public.templates FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage contacts" ON public.contacts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage testimonials" ON public.testimonials FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage currency rates" ON public.currency_rates FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_currency_rates_updated_at BEFORE UPDATE ON public.currency_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Insert default currency rates
INSERT INTO public.currency_rates (currency, rate_to_sar, symbol, is_default) VALUES
('SAR', 1.0000, 'ر.س', true),
('USD', 3.7500, '$', false),
('EGP', 0.0760, 'ج.م', false);

-- Insert default template categories
INSERT INTO public.template_categories (name_ar, name_en, slug, icon, sort_order) VALUES
('المحاسبة المالية', 'Financial Accounting', 'financial-accounting', 'Calculator', 1),
('محاسبة التكاليف', 'Cost Accounting', 'cost-accounting', 'TrendingUp', 2),
('إدارة المخازن', 'Inventory Management', 'inventory', 'Package', 3),
('الموارد البشرية', 'Human Resources', 'hr', 'Users', 4);

-- Insert sample testimonials
INSERT INTO public.testimonials (name_ar, name_en, activity_ar, activity_en, rating, comment_ar, comment_en, sort_order) VALUES
('أحمد محمد', 'Ahmed Mohammed', 'مدير مالي', 'Financial Manager', 5, 'نماذج احترافية وسهلة الاستخدام، وفرت علي الكثير من الوقت والجهد', 'Professional and easy-to-use templates, saved me a lot of time and effort', 1),
('سارة العلي', 'Sara Al-Ali', 'محاسبة', 'Accountant', 5, 'أفضل نماذج محاسبية وجدتها، الدعم الفني ممتاز', 'Best accounting templates I found, excellent technical support', 2),
('خالد الرشيد', 'Khaled Al-Rashid', 'صاحب شركة', 'Business Owner', 4, 'ساعدتني النماذج في تنظيم حسابات شركتي بشكل احترافي', 'The templates helped me organize my company accounts professionally', 3);

-- Insert default site settings
INSERT INTO public.site_settings (key, value_ar, value_en, value_json) VALUES
('hero_title', 'حلول محاسبية متكاملة لنجاح أعمالك', 'Complete Accounting Solutions for Your Business Success', NULL),
('hero_subtitle', 'نقدم لك أفضل النماذج والخدمات المحاسبية لتطوير عملك', 'We provide you with the best accounting templates and services to grow your business', NULL),
('bank_account', NULL, NULL, '{"bank_name_ar": "البنك الأهلي السعودي", "bank_name_en": "Saudi National Bank", "account_name": "Costamine Accounting", "account_number": "1234567890", "iban": "SA0000000000001234567890"}'),
('contact_info', NULL, NULL, '{"email": "info@costamine.com", "phone": "+966500000000", "address_ar": "الرياض، المملكة العربية السعودية", "address_en": "Riyadh, Saudi Arabia"}');
