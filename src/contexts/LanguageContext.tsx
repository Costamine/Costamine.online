import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.features': 'المميزات',
    'nav.services': 'الخدمات',
    'nav.templates': 'النماذج',
    'nav.testimonials': 'آراء العملاء',
    'nav.contact': 'تواصل معنا',
    'nav.browseTemplates': 'تصفح النماذج',
    'nav.admin': 'لوحة التحكم',
    
    // Hero
    'hero.title': 'حلول محاسبية متكاملة لنجاح أعمالك',
    'hero.subtitle': 'نقدم لك أفضل النماذج والخدمات المحاسبية الاحترافية لتطوير عملك وتحقيق أهدافك المالية',
    'hero.cta.templates': 'تصفح النماذج',
    'hero.cta.contact': 'تواصل معنا',
    
    // Features
    'features.title': 'لماذا تختارنا؟',
    'features.subtitle': 'نقدم لك مميزات فريدة تجعل عملك أسهل وأكثر احترافية',
    'features.professional.title': 'نماذج احترافية',
    'features.professional.desc': 'نماذج محاسبية مصممة باحترافية عالية وفق المعايير المحاسبية المعتمدة',
    'features.easy.title': 'سهولة الاستخدام',
    'features.easy.desc': 'واجهة بسيطة وسهلة الاستخدام تناسب جميع المستويات',
    'features.support.title': 'دعم فني متميز',
    'features.support.desc': 'فريق دعم فني متخصص لمساعدتك في أي وقت',
    'features.updates.title': 'تحديثات مستمرة',
    'features.updates.desc': 'تحديثات دورية للنماذج لتواكب أحدث المعايير المحاسبية',
    'features.secure.title': 'آمن وموثوق',
    'features.secure.desc': 'حماية كاملة لبياناتك ومعاملاتك المالية',
    'features.arabic.title': 'دعم اللغة العربية',
    'features.arabic.desc': 'نماذج متوفرة باللغة العربية والإنجليزية',
    
    // Services
    'services.title': 'خدماتنا',
    'services.subtitle': 'نقدم مجموعة متكاملة من الخدمات المحاسبية والمالية',
    
    // Templates
    'templates.title': 'النماذج المحاسبية',
    'templates.subtitle': 'اختر من بين مجموعة واسعة من النماذج الاحترافية',
    'templates.all': 'جميع النماذج',
    'templates.free': 'مجاني',
    'templates.paid': 'مدفوع',
    'templates.download': 'تحميل مجاني',
    'templates.addToCart': 'أضف للسلة',
    'templates.watchVideo': 'مشاهدة الفيديو',
    'templates.noResults': 'لا توجد نماذج متاحة',
    
    // Categories
    'category.financial-accounting': 'المحاسبة المالية',
    'category.cost-accounting': 'محاسبة التكاليف',
    'category.inventory': 'إدارة المخازن',
    'category.hr': 'الموارد البشرية',
    
    // Cart
    'cart.title': 'سلة التسوق',
    'cart.empty': 'السلة فارغة',
    'cart.total': 'المجموع',
    'cart.checkout': 'إتمام الطلب',
    'cart.remove': 'حذف',
    'cart.items': 'عناصر',
    
    // Checkout
    'checkout.title': 'إتمام الطلب',
    'checkout.customerInfo': 'معلومات العميل',
    'checkout.name': 'الاسم الكامل',
    'checkout.email': 'البريد الإلكتروني',
    'checkout.phone': 'رقم الجوال',
    'checkout.bankInfo': 'معلومات الحساب البنكي',
    'checkout.bankName': 'اسم البنك',
    'checkout.accountName': 'اسم الحساب',
    'checkout.accountNumber': 'رقم الحساب',
    'checkout.iban': 'رقم الآيبان',
    'checkout.uploadProof': 'رفع إثبات التحويل',
    'checkout.submit': 'إرسال الطلب',
    'checkout.success': 'تم إرسال طلبك بنجاح!',
    'checkout.orderNumber': 'رقم الطلب',
    
    // Contact
    'contact.title': 'تواصل معنا',
    'contact.subtitle': 'نحن هنا لمساعدتك، تواصل معنا في أي وقت',
    'contact.name': 'الاسم',
    'contact.email': 'البريد الإلكتروني',
    'contact.phone': 'رقم الجوال',
    'contact.message': 'الرسالة',
    'contact.send': 'إرسال الرسالة',
    'contact.success': 'تم إرسال رسالتك بنجاح!',
    
    // Testimonials
    'testimonials.title': 'آراء عملائنا',
    'testimonials.subtitle': 'ماذا يقول عملاؤنا عن خدماتنا',
    
    // Footer
    'footer.description': 'حلول محاسبية متكاملة لنجاح أعمالك',
    'footer.quickLinks': 'روابط سريعة',
    'footer.contactInfo': 'معلومات التواصل',
    'footer.rights': 'جميع الحقوق محفوظة',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.retry': 'إعادة المحاولة',
    'common.close': 'إغلاق',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.price': 'السعر',
    'common.currency': 'العملة',
    
    // Admin
    'admin.login': 'تسجيل الدخول',
    'admin.logout': 'تسجيل الخروج',
    'admin.dashboard': 'لوحة التحكم',
    'admin.templates': 'إدارة النماذج',
    'admin.categories': 'إدارة التصنيفات',
    'admin.orders': 'إدارة الطلبات',
    'admin.contacts': 'الرسائل',
    'admin.testimonials': 'إدارة التقييمات',
    'admin.settings': 'الإعدادات',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.services': 'Services',
    'nav.templates': 'Templates',
    'nav.testimonials': 'Testimonials',
    'nav.contact': 'Contact',
    'nav.browseTemplates': 'Browse Templates',
    'nav.admin': 'Admin Panel',
    
    // Hero
    'hero.title': 'Complete Accounting Solutions for Your Business Success',
    'hero.subtitle': 'We provide you with the best professional accounting templates and services to grow your business and achieve your financial goals',
    'hero.cta.templates': 'Browse Templates',
    'hero.cta.contact': 'Contact Us',
    
    // Features
    'features.title': 'Why Choose Us?',
    'features.subtitle': 'We offer unique features that make your work easier and more professional',
    'features.professional.title': 'Professional Templates',
    'features.professional.desc': 'Professionally designed accounting templates according to approved standards',
    'features.easy.title': 'Easy to Use',
    'features.easy.desc': 'Simple and user-friendly interface suitable for all levels',
    'features.support.title': 'Excellent Support',
    'features.support.desc': 'Specialized technical support team to help you anytime',
    'features.updates.title': 'Regular Updates',
    'features.updates.desc': 'Regular template updates to keep up with latest accounting standards',
    'features.secure.title': 'Safe & Reliable',
    'features.secure.desc': 'Complete protection for your data and financial transactions',
    'features.arabic.title': 'Arabic Support',
    'features.arabic.desc': 'Templates available in both Arabic and English',
    
    // Services
    'services.title': 'Our Services',
    'services.subtitle': 'We offer a comprehensive range of accounting and financial services',
    
    // Templates
    'templates.title': 'Accounting Templates',
    'templates.subtitle': 'Choose from a wide range of professional templates',
    'templates.all': 'All Templates',
    'templates.free': 'Free',
    'templates.paid': 'Paid',
    'templates.download': 'Free Download',
    'templates.addToCart': 'Add to Cart',
    'templates.watchVideo': 'Watch Video',
    'templates.noResults': 'No templates available',
    
    // Categories
    'category.financial-accounting': 'Financial Accounting',
    'category.cost-accounting': 'Cost Accounting',
    'category.inventory': 'Inventory Management',
    'category.hr': 'Human Resources',
    
    // Cart
    'cart.title': 'Shopping Cart',
    'cart.empty': 'Cart is empty',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.remove': 'Remove',
    'cart.items': 'items',
    
    // Checkout
    'checkout.title': 'Checkout',
    'checkout.customerInfo': 'Customer Information',
    'checkout.name': 'Full Name',
    'checkout.email': 'Email Address',
    'checkout.phone': 'Phone Number',
    'checkout.bankInfo': 'Bank Account Information',
    'checkout.bankName': 'Bank Name',
    'checkout.accountName': 'Account Name',
    'checkout.accountNumber': 'Account Number',
    'checkout.iban': 'IBAN Number',
    'checkout.uploadProof': 'Upload Transfer Proof',
    'checkout.submit': 'Submit Order',
    'checkout.success': 'Your order has been submitted successfully!',
    'checkout.orderNumber': 'Order Number',
    
    // Contact
    'contact.title': 'Contact Us',
    'contact.subtitle': "We're here to help, contact us anytime",
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.message': 'Message',
    'contact.send': 'Send Message',
    'contact.success': 'Your message has been sent successfully!',
    
    // Testimonials
    'testimonials.title': 'Customer Reviews',
    'testimonials.subtitle': 'What our customers say about our services',
    
    // Footer
    'footer.description': 'Complete accounting solutions for your business success',
    'footer.quickLinks': 'Quick Links',
    'footer.contactInfo': 'Contact Info',
    'footer.rights': 'All Rights Reserved',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Retry',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.price': 'Price',
    'common.currency': 'Currency',
    
    // Admin
    'admin.login': 'Login',
    'admin.logout': 'Logout',
    'admin.dashboard': 'Dashboard',
    'admin.templates': 'Manage Templates',
    'admin.categories': 'Manage Categories',
    'admin.orders': 'Manage Orders',
    'admin.contacts': 'Messages',
    'admin.testimonials': 'Manage Reviews',
    'admin.settings': 'Settings',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
