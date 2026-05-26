import * as XLSX from 'xlsx';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface TBRow {
  account: string;
  debit: number;
  credit: number;
  type: AccountType;
  balance: number; // signed: assets/expenses positive on debit; liab/equity/revenue positive on credit
}

const KEYWORDS: Record<AccountType, string[]> = {
  asset: [
    'cash', 'bank', 'receivable', 'inventory', 'stock', 'asset', 'equipment', 'machinery',
    'building', 'land', 'vehicle', 'prepaid', 'deposit', 'investment',
    'نقد', 'نقدية', 'بنك', 'صندوق', 'مدين', 'عميل', 'عملاء', 'مخزون', 'بضاعة', 'أصول', 'أصل',
    'معدات', 'مباني', 'أراضي', 'سيارات', 'استثمار', 'مدفوع مقدماً', 'مقدم',
  ],
  liability: [
    'payable', 'loan', 'liability', 'creditor', 'accrued', 'tax payable', 'overdraft',
    'دائن', 'دائنين', 'مورد', 'موردين', 'قرض', 'قروض', 'التزام', 'التزامات', 'ضريبة مستحقة', 'مستحقات',
  ],
  equity: [
    'equity', 'capital', 'retained', 'drawing', 'owner', 'shareholder', 'reserve',
    'رأس المال', 'رأس مال', 'حقوق الملكية', 'احتياطي', 'أرباح محتجزة', 'مسحوبات', 'ملكية',
  ],
  revenue: [
    'revenue', 'sales', 'income', 'service revenue', 'fees earned', 'interest income', 'gain',
    'إيراد', 'إيرادات', 'مبيعات', 'دخل', 'أرباح', 'عمولات',
  ],
  expense: [
    'expense', 'cost', 'salary', 'wages', 'rent', 'utilities', 'depreciation', 'cogs',
    'purchase', 'advertising', 'insurance', 'tax expense', 'loss',
    'مصروف', 'مصروفات', 'مصاريف', 'تكلفة', 'تكاليف', 'رواتب', 'أجور', 'إيجار', 'استهلاك',
    'مشتريات', 'إعلان', 'تأمين', 'كهرباء', 'مياه', 'خسائر',
  ],
};

export function classifyAccount(name: string): AccountType {
  const n = (name || '').toLowerCase();
  let best: { type: AccountType; score: number } = { type: 'asset', score: 0 };
  (Object.keys(KEYWORDS) as AccountType[]).forEach(type => {
    for (const kw of KEYWORDS[type]) {
      if (n.includes(kw.toLowerCase())) {
        const score = kw.length;
        if (score > best.score) best = { type, score };
      }
    }
  });
  return best.score > 0 ? best.type : 'asset';
}

function num(v: any): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/[, ]/g, ''));
  return isNaN(n) ? 0 : n;
}

function findKey(keys: string[], aliases: string[]): string | null {
  const lower = keys.map(k => k.toLowerCase().trim());
  for (const a of aliases) {
    const i = lower.findIndex(k => k === a.toLowerCase() || k.includes(a.toLowerCase()));
    if (i >= 0) return keys[i];
  }
  return null;
}

export interface ParsedTB {
  rows: TBRow[];
  errors: string[];
}

export async function parseTrialBalance(file: File): Promise<ParsedTB> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
  const errors: string[] = [];
  if (!raw.length) return { rows: [], errors: ['Empty sheet'] };

  const keys = Object.keys(raw[0]);
  const acctKey = findKey(keys, ['account name', 'account', 'الحساب', 'اسم الحساب']);
  const debitKey = findKey(keys, ['debit', 'مدين']);
  const creditKey = findKey(keys, ['credit', 'دائن']);

  if (!acctKey || !debitKey || !creditKey) {
    return { rows: [], errors: [`Required columns not found. Need: Account Name, Debit, Credit`] };
  }

  const rows: TBRow[] = raw
    .map(r => {
      const account = String(r[acctKey] ?? '').trim();
      if (!account) return null;
      const debit = num(r[debitKey]);
      const credit = num(r[creditKey]);
      const type = classifyAccount(account);
      const balance =
        type === 'asset' || type === 'expense' ? debit - credit : credit - debit;
      return { account, debit, credit, type, balance };
    })
    .filter((r): r is TBRow => r !== null);

  return { rows, errors };
}

export interface FinancialStatements {
  income: {
    revenues: TBRow[];
    expenses: TBRow[];
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
  };
  balanceSheet: {
    assets: TBRow[];
    liabilities: TBRow[];
    equity: TBRow[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    netIncome: number;
    isBalanced: boolean;
  };
  totals: { debit: number; credit: number; balanced: boolean };
}

export function buildStatements(rows: TBRow[]): FinancialStatements {
  const by = (t: AccountType) => rows.filter(r => r.type === t);
  const sum = (arr: TBRow[]) => arr.reduce((s, r) => s + r.balance, 0);

  const revenues = by('revenue');
  const expenses = by('expense');
  const assets = by('asset');
  const liabilities = by('liability');
  const equity = by('equity');

  const totalRevenue = sum(revenues);
  const totalExpense = sum(expenses);
  const netIncome = totalRevenue - totalExpense;

  const totalAssets = sum(assets);
  const totalLiabilities = sum(liabilities);
  const totalEquity = sum(equity) + netIncome;

  const debit = rows.reduce((s, r) => s + r.debit, 0);
  const credit = rows.reduce((s, r) => s + r.credit, 0);

  return {
    income: { revenues, expenses, totalRevenue, totalExpense, netIncome },
    balanceSheet: {
      assets, liabilities, equity,
      totalAssets, totalLiabilities, totalEquity, netIncome,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    },
    totals: { debit, credit, balanced: Math.abs(debit - credit) < 0.01 },
  };
}