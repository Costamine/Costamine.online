import * as XLSX from 'xlsx';

export interface BankTxn {
  id: string;
  date: Date | null;
  dateStr: string;
  description: string;
  debit: number;     // money out (positive number)
  credit: number;    // money in  (positive number)
  amount: number;    // signed: credit - debit
  balance: number | null;
  category: string;
}

export interface ParsedStatement {
  txns: BankTxn[];
  columns: { date?: string; desc?: string; debit?: string; credit?: string; amount?: string; balance?: string };
  rawRowCount: number;
}

const ALIASES = {
  date: ['date', 'transaction date', 'value date', 'posting date', 'trans date', 'التاريخ', 'تاريخ', 'تاريخ العملية', 'تاريخ القيد'],
  desc: ['description', 'desc', 'narration', 'details', 'memo', 'particulars', 'transaction', 'البيان', 'الوصف', 'تفاصيل', 'ملاحظات', 'بيان العملية'],
  debit: ['debit', 'withdrawal', 'withdrawals', 'paid out', 'out', 'dr', 'مدين', 'سحب', 'مسحوب', 'صادر', 'خصم'],
  credit: ['credit', 'deposit', 'deposits', 'paid in', 'in', 'cr', 'دائن', 'إيداع', 'وارد', 'إضافة'],
  amount: ['amount', 'value', 'transaction amount', 'المبلغ', 'القيمة', 'قيمة العملية'],
  balance: ['balance', 'running balance', 'closing balance', 'الرصيد', 'رصيد', 'الرصيد المتبقي'],
} as const;

function num(v: any): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  let s = String(v).trim();
  // Handle (123) negative
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  s = s.replace(/[^\d.\-]/g, '');
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  return neg ? -n : n;
}

function parseDate(raw: any): Date | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === 'number') {
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const s = String(raw).trim();
  const sep = s.includes('/') ? '/' : s.includes('-') ? '-' : s.includes('.') ? '.' : null;
  if (sep) {
    const p = s.split(sep).map(x => parseInt(x, 10));
    if (p.length === 3 && !p.some(isNaN)) {
      if (p[0] > 31) return new Date(p[0], p[1] - 1, p[2]);
      if (p[2] > 31 || p[2] < 100) return new Date(p[2] < 100 ? 2000 + p[2] : p[2], p[1] - 1, p[0]);
      return new Date(p[2], p[1] - 1, p[0]);
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function findKey(keys: string[], aliases: readonly string[]): string | undefined {
  const lower = keys.map(k => k.toLowerCase().trim());
  for (const a of aliases) {
    const i = lower.findIndex(k => k === a.toLowerCase());
    if (i >= 0) return keys[i];
  }
  for (const a of aliases) {
    const i = lower.findIndex(k => k.includes(a.toLowerCase()));
    if (i >= 0) return keys[i];
  }
  return undefined;
}

const CATEGORIES: { name: string; keywords: string[] }[] = [
  { name: 'Salary', keywords: ['salary', 'payroll', 'راتب', 'مرتب', 'أجر'] },
  { name: 'Transfer', keywords: ['transfer', 'tfr', 'تحويل', 'حوالة'] },
  { name: 'ATM', keywords: ['atm', 'cash withdrawal', 'صراف', 'سحب نقدي'] },
  { name: 'POS / Shopping', keywords: ['pos', 'purchase', 'shop', 'mart', 'store', 'amazon', 'noon', 'متجر', 'شراء', 'سوق'] },
  { name: 'Food', keywords: ['restaurant', 'cafe', 'coffee', 'food', 'mcdonald', 'kfc', 'starbucks', 'مطعم', 'كافيه', 'طعام'] },
  { name: 'Fuel', keywords: ['fuel', 'petrol', 'gas station', 'aramco', 'وقود', 'بنزين', 'محطة'] },
  { name: 'Utilities', keywords: ['electric', 'water', 'gas bill', 'internet', 'phone', 'mobile', 'stc', 'mobily', 'كهرباء', 'مياه', 'انترنت', 'هاتف', 'فاتورة'] },
  { name: 'Bank Fees', keywords: ['fee', 'charge', 'commission', 'service charge', 'رسوم', 'عمولة'] },
  { name: 'Loan / Installment', keywords: ['loan', 'installment', 'قرض', 'قسط'] },
  { name: 'Investment', keywords: ['invest', 'dividend', 'stock', 'استثمار', 'أرباح', 'سهم'] },
  { name: 'Healthcare', keywords: ['hospital', 'clinic', 'pharmacy', 'medical', 'مستشفى', 'صيدلية', 'طبي'] },
  { name: 'Education', keywords: ['school', 'university', 'tuition', 'مدرسة', 'جامعة', 'تعليم'] },
  { name: 'Travel', keywords: ['hotel', 'flight', 'airline', 'booking', 'فندق', 'طيران', 'سفر'] },
];

function categorize(desc: string): string {
  const d = desc.toLowerCase();
  for (const c of CATEGORIES) {
    if (c.keywords.some(k => d.includes(k.toLowerCase()))) return c.name;
  }
  return 'Other';
}

export async function parseBankStatement(file: File): Promise<ParsedStatement> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  // Pick the sheet with the most rows
  let bestSheet = wb.SheetNames[0];
  let bestCount = 0;
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
    if (rows.length > bestCount) { bestCount = rows.length; bestSheet = name; }
  }
  const ws = wb.Sheets[bestSheet];
  // Try to find header row by scanning first 10 rows for max non-empty
  const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
  let headerRow = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(10, aoa.length); i++) {
    const score = aoa[i].filter(c => String(c).trim() !== '').length;
    if (score > bestScore) { bestScore = score; headerRow = i; }
  }
  const headers = aoa[headerRow].map((h, i) => String(h).trim() || `col_${i}`);
  const rows = aoa.slice(headerRow + 1).map(r => {
    const o: Record<string, any> = {};
    headers.forEach((h, i) => { o[h] = r[i]; });
    return o;
  }).filter(r => Object.values(r).some(v => v !== '' && v != null));

  const dateKey = findKey(headers, ALIASES.date);
  const descKey = findKey(headers, ALIASES.desc);
  const debitKey = findKey(headers, ALIASES.debit);
  const creditKey = findKey(headers, ALIASES.credit);
  const amountKey = findKey(headers, ALIASES.amount);
  const balanceKey = findKey(headers, ALIASES.balance);

  const txns: BankTxn[] = rows.map((r, i) => {
    const date = dateKey ? parseDate(r[dateKey]) : null;
    const description = descKey ? String(r[descKey] ?? '').trim() : '';
    let debit = debitKey ? Math.abs(num(r[debitKey])) : 0;
    let credit = creditKey ? Math.abs(num(r[creditKey])) : 0;
    if (!debitKey && !creditKey && amountKey) {
      const a = num(r[amountKey]);
      if (a >= 0) credit = a; else debit = Math.abs(a);
    }
    const balance = balanceKey ? num(r[balanceKey]) : null;
    const amount = credit - debit;
    return {
      id: `t-${i}`,
      date,
      dateStr: date ? date.toISOString().slice(0, 10) : '',
      description,
      debit, credit, amount, balance,
      category: categorize(description),
    };
  }).filter(t => t.debit !== 0 || t.credit !== 0 || t.description);

  // Sort by date asc
  txns.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

  return {
    txns,
    columns: { date: dateKey, desc: descKey, debit: debitKey, credit: creditKey, amount: amountKey, balance: balanceKey },
    rawRowCount: rows.length,
  };
}

export interface BankInsights {
  totalDeposits: number;
  totalWithdrawals: number;
  netFlow: number;
  currentBalance: number | null;
  txnCount: number;
  largest: BankTxn | null;
  averageTxn: number;
  byMonth: { month: string; deposits: number; withdrawals: number; net: number }[];
  byCategory: { name: string; value: number; count: number }[];
  byWeekday: { name: string; deposits: number; withdrawals: number }[];
  balanceTrend: { date: string; balance: number }[];
  recurring: { description: string; count: number; total: number }[];
  anomalies: BankTxn[];
  alerts: { type: 'info' | 'warning' | 'success'; text: string; textAr: string }[];
}

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function computeInsights(txns: BankTxn[]): BankInsights {
  const totalDeposits = txns.reduce((s, t) => s + t.credit, 0);
  const totalWithdrawals = txns.reduce((s, t) => s + t.debit, 0);
  const netFlow = totalDeposits - totalWithdrawals;
  const txnCount = txns.length;
  const averageTxn = txnCount ? (totalDeposits + totalWithdrawals) / txnCount : 0;

  let largest: BankTxn | null = null;
  for (const t of txns) {
    const a = Math.max(t.debit, t.credit);
    const la = largest ? Math.max(largest.debit, largest.credit) : -1;
    if (a > la) largest = t;
  }

  // Monthly grouping
  const monthMap = new Map<string, { deposits: number; withdrawals: number }>();
  for (const t of txns) {
    if (!t.date) continue;
    const k = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    const m = monthMap.get(k) || { deposits: 0, withdrawals: 0 };
    m.deposits += t.credit;
    m.withdrawals += t.debit;
    monthMap.set(k, m);
  }
  const byMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      const [y, m] = k.split('-');
      return {
        month: `${MONTHS_EN[parseInt(m, 10) - 1]} ${y.slice(2)}`,
        deposits: v.deposits,
        withdrawals: v.withdrawals,
        net: v.deposits - v.withdrawals,
      };
    });

  // Category
  const catMap = new Map<string, { value: number; count: number }>();
  for (const t of txns) {
    if (t.debit <= 0) continue;
    const c = catMap.get(t.category) || { value: 0, count: 0 };
    c.value += t.debit;
    c.count += 1;
    catMap.set(t.category, c);
  }
  const byCategory = Array.from(catMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.value - a.value);

  // Weekday
  const wdMap = new Map<number, { deposits: number; withdrawals: number }>();
  for (const t of txns) {
    if (!t.date) continue;
    const w = t.date.getDay();
    const m = wdMap.get(w) || { deposits: 0, withdrawals: 0 };
    m.deposits += t.credit;
    m.withdrawals += t.debit;
    wdMap.set(w, m);
  }
  const byWeekday = WEEKDAYS_EN.map((name, i) => {
    const v = wdMap.get(i) || { deposits: 0, withdrawals: 0 };
    return { name, ...v };
  });

  // Balance trend (running)
  let runBal = 0;
  const useReported = txns.some(t => t.balance != null);
  const balanceTrend = txns
    .filter(t => t.date)
    .map(t => {
      runBal += t.amount;
      return { date: t.dateStr, balance: useReported && t.balance != null ? t.balance : runBal };
    });
  const currentBalance = balanceTrend.length ? balanceTrend[balanceTrend.length - 1].balance : null;

  // Recurring detection: same description (normalized) appearing 3+ times
  const normMap = new Map<string, BankTxn[]>();
  for (const t of txns) {
    const key = t.description.toLowerCase().replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
    if (!key) continue;
    const arr = normMap.get(key) || [];
    arr.push(t);
    normMap.set(key, arr);
  }
  const recurring = Array.from(normMap.entries())
    .filter(([, arr]) => arr.length >= 3)
    .map(([, arr]) => ({
      description: arr[0].description,
      count: arr.length,
      total: arr.reduce((s, t) => s + t.debit + t.credit, 0),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Anomalies: amounts > mean + 2*std
  const amounts = txns.map(t => Math.max(t.debit, t.credit)).filter(a => a > 0);
  const mean = amounts.reduce((s, n) => s + n, 0) / (amounts.length || 1);
  const variance = amounts.reduce((s, n) => s + (n - mean) ** 2, 0) / (amounts.length || 1);
  const std = Math.sqrt(variance);
  const threshold = mean + 2 * std;
  const anomalies = txns
    .filter(t => Math.max(t.debit, t.credit) > threshold && threshold > 0)
    .sort((a, b) => Math.max(b.debit, b.credit) - Math.max(a.debit, a.credit))
    .slice(0, 10);

  // Alerts
  const alerts: BankInsights['alerts'] = [];
  if (netFlow < 0) alerts.push({
    type: 'warning',
    text: `Negative cash flow of ${Math.abs(netFlow).toLocaleString()} — withdrawals exceed deposits.`,
    textAr: `تدفق نقدي سالب بقيمة ${Math.abs(netFlow).toLocaleString()} — السحوبات تتجاوز الإيداعات.`,
  });
  if (netFlow > 0) alerts.push({
    type: 'success',
    text: `Positive cash flow of ${netFlow.toLocaleString()}.`,
    textAr: `تدفق نقدي موجب بقيمة ${netFlow.toLocaleString()}.`,
  });
  if (anomalies.length) alerts.push({
    type: 'info',
    text: `${anomalies.length} unusual transaction(s) detected.`,
    textAr: `تم اكتشاف ${anomalies.length} عملية غير اعتيادية.`,
  });
  const fees = byCategory.find(c => c.name === 'Bank Fees');
  if (fees) alerts.push({
    type: 'warning',
    text: `Bank fees totaled ${fees.value.toLocaleString()} across ${fees.count} charges.`,
    textAr: `إجمالي الرسوم البنكية ${fees.value.toLocaleString()} على ${fees.count} عملية.`,
  });

  return {
    totalDeposits, totalWithdrawals, netFlow, currentBalance,
    txnCount, largest, averageTxn,
    byMonth, byCategory, byWeekday, balanceTrend,
    recurring, anomalies, alerts,
  };
}

export function exportTxnsToExcel(txns: BankTxn[], filename = 'bank-statement-analysis.xlsx') {
  const data = txns.map(t => ({
    Date: t.dateStr,
    Description: t.description,
    Debit: t.debit,
    Credit: t.credit,
    Balance: t.balance ?? '',
    Category: t.category,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  XLSX.writeFile(wb, filename);
}