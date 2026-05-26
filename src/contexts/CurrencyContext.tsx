import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'SAR' | 'USD' | 'EGP';

interface CurrencyRate {
  currency: Currency;
  rate_to_sar: number;
  symbol: string;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceSAR: number) => string;
  convertPrice: (priceSAR: number) => number;
  getCurrencySymbol: () => string;
  rates: Record<Currency, CurrencyRate>;
}

const defaultRates: Record<Currency, CurrencyRate> = {
  SAR: { currency: 'SAR', rate_to_sar: 1, symbol: 'ر.س' },
  USD: { currency: 'USD', rate_to_sar: 3.75, symbol: '$' },
  EGP: { currency: 'EGP', rate_to_sar: 0.076, symbol: 'ج.م' },
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    return (saved === 'SAR' || saved === 'USD' || saved === 'EGP') ? saved : 'SAR';
  });
  
  const [rates] = useState<Record<Currency, CurrencyRate>>(defaultRates);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
  };

  const convertPrice = (priceSAR: number): number => {
    if (currency === 'SAR') return priceSAR;
    const rate = rates[currency].rate_to_sar;
    return Number((priceSAR / rate).toFixed(2));
  };

  const getCurrencySymbol = (): string => {
    return rates[currency].symbol;
  };

  const formatPrice = (priceSAR: number): string => {
    const converted = convertPrice(priceSAR);
    const symbol = getCurrencySymbol();
    return `${converted.toLocaleString()} ${symbol}`;
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatPrice, 
      convertPrice,
      getCurrencySymbol,
      rates 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
