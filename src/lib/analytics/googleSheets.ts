import { SalesRow, COLUMN_ALIASES } from './types';

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Convert a Google Sheets URL into a CSV export URL. */
export function buildCsvUrl(input: string, sheetName?: string): string | null {
  const url = input.trim();
  if (!url) return null;

  // Already a CSV URL (output=csv or tqx=out:csv)
  if (/output=csv|tqx=out:csv/i.test(url)) return appendCacheBust(url);

  // /pub published URL → use /pub?output=csv
  const pubMatch = url.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)\/pub/);
  if (pubMatch) {
    return appendCacheBust(`https://docs.google.com/spreadsheets/d/e/${pubMatch[1]}/pub?output=csv${sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''}`);
  }

  // Regular sheet URL → /gviz/tq?tqx=out:csv
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch) {
    const id = idMatch[1];
    const gidMatch = url.match(/[#&?]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
    return appendCacheBust(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}${sheetParam}`);
  }
  return null;
}

function appendCacheBust(u: string): string {
  const sep = u.includes('?') ? '&' : '?';
  return `${u}${sep}_cb=${Date.now()}`;
}

/** Minimal CSV parser handling quoted fields & commas. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.length > 1 || (r[0] && r[0].length));
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  if (s.includes('/')) {
    const p = s.split('/').map(x => parseInt(x, 10));
    if (p.length === 3 && !p.some(isNaN)) {
      const yr = p[2] < 100 ? 2000 + p[2] : p[2];
      return new Date(yr, p[1] - 1, p[0]);
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function pickIndex(headers: string[], aliases: readonly string[]): number {
  for (const a of aliases) {
    const i = headers.findIndex(h => h.trim() === a);
    if (i >= 0) return i;
  }
  return -1;
}

export interface CsvParseResult {
  rows: SalesRow[];
  totalRecords: number;
  errors: string[];
}

export function csvToSalesRows(csv: string): CsvParseResult {
  const grid = parseCsv(csv);
  if (!grid.length) return { rows: [], totalRecords: 0, errors: ['Empty CSV'] };
  const headers = grid[0].map(h => h.trim());
  const dIdx = pickIndex(headers, COLUMN_ALIASES.date);
  const vIdx = pickIndex(headers, COLUMN_ALIASES.value);
  const qIdx = pickIndex(headers, COLUMN_ALIASES.qty);
  const bIdx = pickIndex(headers, COLUMN_ALIASES.branch);
  const cIdx = pickIndex(headers, COLUMN_ALIASES.category);
  if (dIdx < 0 || vIdx < 0) {
    return { rows: [], totalRecords: 0, errors: [`Missing required columns. Headers: ${headers.join(', ')}`] };
  }
  const rows: SalesRow[] = [];
  for (let i = 1; i < grid.length; i++) {
    const r = grid[i];
    const d = parseDate(r[dIdx] ?? '');
    if (!d) continue;
    const value = parseFloat((r[vIdx] || '').replace(/,/g, '')) || 0;
    const qty = qIdx >= 0 ? parseFloat((r[qIdx] || '').replace(/,/g, '')) || 0 : 0;
    const branch = (bIdx >= 0 ? r[bIdx] : '')?.trim() || '—';
    const category = (cIdx >= 0 ? r[cIdx] : '')?.trim() || '—';
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    rows.push({
      ds, date: d, value, qty, branch, category,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      weekdayEn: WD[d.getDay()],
    });
  }
  return { rows, totalRecords: rows.length, errors: [] };
}

/** Aggregate by year for YoY growth chart */
export interface YearStat {
  year: number;
  value: number;
  invoices: number;       // row count proxy
  avgInvoice: number;
  growthPct: number | null;
  delta: number | null;
}

export function computeYearlyGrowth(rows: SalesRow[]): YearStat[] {
  const m = new Map<number, { value: number; invoices: number }>();
  for (const r of rows) {
    const y = m.get(r.year) || { value: 0, invoices: 0 };
    y.value += r.value;
    y.invoices += 1;
    m.set(r.year, y);
  }
  const arr = Array.from(m.entries())
    .map(([year, v]) => ({ year, value: v.value, invoices: v.invoices, avgInvoice: v.invoices ? v.value / v.invoices : 0 }))
    .sort((a, b) => a.year - b.year);
  let prev: number | null = null;
  return arr.map(a => {
    const growthPct = prev != null && prev > 0 ? ((a.value - prev) / prev) * 100 : null;
    const delta = prev != null ? a.value - prev : null;
    const result = { ...a, growthPct, delta };
    prev = a.value;
    return result;
  });
}