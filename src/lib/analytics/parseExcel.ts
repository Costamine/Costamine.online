import * as XLSX from 'xlsx';
import { SalesRow, COLUMN_ALIASES } from './types';

function pick(row: Record<string, any>, keys: readonly string[]): any {
  for (const k of keys) if (row[k] !== undefined && row[k] !== '') return row[k];
  return undefined;
}

function parseDate(raw: any): Date | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  // Excel serial number
  if (typeof raw === 'number') {
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const s = String(raw).trim();
  if (s.includes('/')) {
    const p = s.split('/').map(Number);
    // dd/mm/yyyy
    if (p.length === 3 && p[2] > 31) return new Date(p[2], p[1] - 1, p[0]);
    if (p.length === 3) return new Date(p[2] < 100 ? 2000 + p[2] : p[2], p[1] - 1, p[0]);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface ParseResult {
  rows: SalesRow[];
  errors: string[];
  totalInputRows: number;
  validRows: number;
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const errors: string[] = [];
  if (!json.length) {
    errors.push('الملف فارغ / File is empty');
    return { rows: [], errors, totalInputRows: 0, validRows: 0 };
  }

  // Validate that at least date + value columns exist in the headers
  const headers = Object.keys(json[0]);
  const hasDate = COLUMN_ALIASES.date.some(k => headers.includes(k));
  const hasValue = COLUMN_ALIASES.value.some(k => headers.includes(k));
  if (!hasDate || !hasValue) {
    errors.push(
      `أعمدة مفقودة. الأعمدة المطلوبة: ${[...COLUMN_ALIASES.date.slice(0, 2), ...COLUMN_ALIASES.value.slice(0, 2)].join(' / ')}`
    );
    return { rows: [], errors, totalInputRows: json.length, validRows: 0 };
  }

  const rows: SalesRow[] = [];
  for (const r of json) {
    const d = parseDate(pick(r, COLUMN_ALIASES.date));
    if (!d) continue;
    const value = parseFloat(pick(r, COLUMN_ALIASES.value)) || 0;
    const qty = parseFloat(pick(r, COLUMN_ALIASES.qty)) || 0;
    const branch = String(pick(r, COLUMN_ALIASES.branch) ?? '').trim() || '—';
    const category = String(pick(r, COLUMN_ALIASES.category) ?? '').trim() || '—';
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    rows.push({
      ds,
      date: d,
      value,
      qty,
      branch,
      category,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      weekdayEn: WD[d.getDay()],
    });
  }

  if (!rows.length) errors.push('لا توجد صفوف بتاريخ صالح / No rows with valid dates');
  return { rows, errors, totalInputRows: json.length, validRows: rows.length };
}