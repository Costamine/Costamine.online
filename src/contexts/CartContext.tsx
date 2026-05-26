import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  name_ar: string;
  name_en: string;
  price_sar: number;
  preview_image_url?: string;
}

interface AppliedCoupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  totalItems: number;
  totalPriceSAR: number;
  appliedCoupon: AppliedCoupon | null;
  discountAmount: number;
  finalPriceSAR: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    const saved = localStorage.getItem('appliedCoupon');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const isInCart = (id: string): boolean => {
    return items.some(item => item.id === id);
  };

  const totalItems = items.length;
  const totalPriceSAR = items.reduce((sum, item) => sum + item.price_sar, 0);

  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? Math.round((totalPriceSAR * appliedCoupon.discount_value / 100) * 100) / 100
      : Math.min(appliedCoupon.discount_value, totalPriceSAR)
    : 0;

  const finalPriceSAR = Math.max(0, totalPriceSAR - discountAmount);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      return { success: false, message: 'الرجاء إدخال رمز الكوبون' };
    }

    try {
      const { data, error } = await (supabase as any)
        .rpc('lookup_coupon', { coupon_code: trimmedCode });

      if (error || !data || data.length === 0) {
        return { success: false, message: 'رمز الكوبون غير صالح' };
      }

      const coupon = data[0] as any;

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { success: false, message: 'انتهت صلاحية الكوبون' };
      }

      // Check max uses
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return { success: false, message: 'تم استنفاد عدد مرات استخدام الكوبون' };
      }

      // Check min order
      if (coupon.min_order_amount && totalPriceSAR < coupon.min_order_amount) {
        return { success: false, message: `الحد الأدنى للطلب ${coupon.min_order_amount} ر.س` };
      }

      setAppliedCoupon({
        code: coupon.code,
        discount_type: coupon.discount_type as 'percentage' | 'fixed',
        discount_value: coupon.discount_value,
      });

      return { success: true, message: 'تم تطبيق الكوبون بنجاح!' };
    } catch {
      return { success: false, message: 'حدث خطأ، حاول مرة أخرى' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearCart,
      isInCart,
      totalItems,
      totalPriceSAR,
      appliedCoupon,
      discountAmount,
      finalPriceSAR,
      applyCoupon,
      removeCoupon,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
