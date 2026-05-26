export interface SalesRow {
  ds: string;        // YYYY-MM-DD
  date: Date;
  value: number;
  qty: number;
  branch: string;
  category: string;
  year: number;
  month: number;
  weekdayEn: string;
}

export interface Filters {
  from: Date | null;
  to: Date | null;
  branch: string;     // 'all' or value
  category: string;   // 'all' or value
  monthTab: number | 'all';
}

export interface Aggregations {
  totalValue: number;
  totalQty: number;
  avgUnitPrice: number;
  dailyAvg: number;
  daysCount: number;
  topCategory: { name: string; value: number } | null;
  topWeekday: { name: string; value: number } | null;
  byDay: { ds: string; value: number; qty: number }[];
  byMonth: { month: number; value: number; qty: number }[];
  byWeekday: { name: string; value: number }[];
  byBranch: { name: string; value: number; qty: number }[];
  byCategory: { name: string; value: number; qty: number }[];
  monthlyByBranch: { month: number; [branch: string]: number | string }[];
  monthlyQtyByBranch: { month: number; [branch: string]: number | string }[];
  branches: string[];
  months: number[];
}

export const COLUMN_ALIASES = {
  date: ['التاريخ', 'Date', 'date'],
  value: ['صافي_الفيمة', 'صافي_القيمة', 'Value', 'value'],
  qty: ['صافي_الكمية', 'Qty', 'qty', 'Quantity'],
  branch: ['اسم_الفرع', 'Branch', 'branch'],
  category: ['اسم_الفئة', 'Category', 'category'],
} as const;

export const TEMPLATE_HEADERS_AR = ['التاريخ', 'صافي_الفيمة', 'صافي_الكمية', 'اسم_الفرع', 'اسم_الفئة'];
export const TEMPLATE_HEADERS_EN = ['Date', 'Value', 'Qty', 'Branch', 'Category'];