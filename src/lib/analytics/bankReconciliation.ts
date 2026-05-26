import * as XLSX from 'xlsx';

export interface Txn {
  id: string;
  date: Date | null;
  description: string;
  amount: number; // signed
  raw: Record<string, any>;
}

export interface MatchPair {
  bank: Txn;
  ledger: Txn;
  score: number;        // 0..1
  amountDiff: number;
  daysDiff: number;
  descSim: number;
}

export interface ReconResult {
  matched: MatchPair[];
  missingInBank: Txn[];   // in ledger, not in bank
  missingInSystem: Txn[]; // in bank, not in ledger
  matchRate: number;      // 0..1 (matched / total unique)
  totals: { bank: number; ledger: number };
}

function num(v: any): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/[, ]/g, ''));
  return isNaN(n) ? 0 : n;
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
    const p = s.split(sep).map(Number);
    if (p.length === 3 && !p.some(isNaN)) {
      if (p[0] > 31) return new Date(p[0], p[1] - 1, p[2]);
      if (p[2] > 31) return new Date(p[2], p[1] - 1, p[0]);
      return new Date(p[2] < 100 ? 2000 + p[2] : p[2], p[1] - 1, p[0]);
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function findKey(keys: string[], aliases: string[]): string | null {
  const lower = keys.map(k => k.toLowerCase().trim());
  for (const a of aliases) {
    const i = lower.findIndex(k => k === a.toLowerCase() || k.includes(a.toLowerCase()));
    if (i >= 0) return keys[i];
  }
  return null;
}

export async function parseTransactions(file: File, prefix: string): Promise<Txn[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
  if (!raw.length) return [];
  const keys = Object.keys(raw[0]);
  const dateKey = findKey(keys, ['date', 'التاريخ', 'تاريخ']);
  const descKey = findKey(keys, ['description', 'desc', 'narration', 'memo', 'البيان', 'الوصف', 'تفاصيل']);
  const amtKey = findKey(keys, ['amount', 'value', 'القيمة', 'المبلغ']);
  const debitKey = findKey(keys, ['debit', 'مدين']);
  const creditKey = findKey(keys, ['credit', 'دائن']);

  return raw.map((r, i) => {
    let amount = 0;
    if (amtKey) amount = num(r[amtKey]);
    else if (debitKey || creditKey) amount = num(r[debitKey || '']) - num(r[creditKey || '']);
    return {
      id: `${prefix}-${i}`,
      date: dateKey ? parseDate(r[dateKey]) : null,
      description: descKey ? String(r[descKey] ?? '').trim() : '',
      amount,
      raw: r,
    };
  }).filter(t => t.amount !== 0 || t.description);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function tokenSim(a: string, b: string): number {
  const ta = new Set(normalize(a).split(' ').filter(Boolean));
  const tb = new Set(normalize(b).split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach(t => { if (tb.has(t)) inter++; });
  return inter / Math.max(ta.size, tb.size);
}

function daysBetween(a: Date | null, b: Date | null): number {
  if (!a || !b) return 999;
  return Math.abs((a.getTime() - b.getTime()) / 86_400_000);
}

const AMOUNT_TOL = 0.01;
const DATE_WINDOW = 5; // days

export function reconcile(bank: Txn[], ledger: Txn[]): ReconResult {
  const usedBank = new Set<string>();
  const usedLedger = new Set<string>();
  const matched: MatchPair[] = [];

  // Greedy best-match: iterate bank, find best ledger candidate
  for (const b of bank) {
    let best: MatchPair | null = null;
    for (const l of ledger) {
      if (usedLedger.has(l.id)) continue;
      const amountDiff = Math.abs(b.amount - l.amount);
      if (amountDiff > AMOUNT_TOL) continue;
      const daysDiff = daysBetween(b.date, l.date);
      if (daysDiff > DATE_WINDOW) continue;
      const descSim = tokenSim(b.description, l.description);
      const dateScore = 1 - daysDiff / DATE_WINDOW;
      const score = 0.5 * 1 + 0.3 * dateScore + 0.2 * descSim; // amount required
      if (!best || score > best.score) {
        best = { bank: b, ledger: l, score, amountDiff, daysDiff, descSim };
      }
    }
    if (best) {
      matched.push(best);
      usedBank.add(best.bank.id);
      usedLedger.add(best.ledger.id);
    }
  }

  const missingInSystem = bank.filter(b => !usedBank.has(b.id));
  const missingInBank = ledger.filter(l => !usedLedger.has(l.id));
  const totalUnique = matched.length + missingInBank.length + missingInSystem.length;
  const matchRate = totalUnique ? matched.length / totalUnique : 0;

  return {
    matched, missingInBank, missingInSystem, matchRate,
    totals: {
      bank: bank.reduce((s, t) => s + t.amount, 0),
      ledger: ledger.reduce((s, t) => s + t.amount, 0),
    },
  };
}