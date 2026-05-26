import * as XLSX from 'xlsx';
import { SalesRow } from './types';
import { Mapping } from './autoDetectColumns';

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
      if (p[0] > 31) return new Date(p[0], p[1] - 1, p[2]); // YYYY-MM-DD
      if (p[2] > 31) return new Date(p[2], p[1] - 1, p[0]); // DD-MM-YYYY
      return new Date(p[2] < 100 ? 2000 + p[2] : p[2], p[1] - 1, p[0]);
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseNum(raw: any): number {
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'number') return raw;
  const n = parseFloat(String(raw).replace(/[, ]/g, ''));
  return isNaN(n) ? 0 : n;
}

export interface NormalizeResult {
  rows: SalesRow[];
  errors: string[];
  validRows: number;
  totalInputRows: number;
}

export function normalizeData(raw: Record<string, any>[], mapping: Mapping): NormalizeResult {
  const errors: string[] = [];
  if (!mapping.date || !mapping.value) {
    errors.push('Date and Value mappings are required');
    return { rows: [], errors, validRows: 0, totalInputRows: raw.length };
  }

  const rows: SalesRow[] = [];
  for (const r of raw) {
    const d = parseDate(r[mapping.date]);
    if (!d) continue;
    const value = parseNum(r[mapping.value]);
    const qty = mapping.qty ? parseNum(r[mapping.qty]) : 0;
    const branch = mapping.branch ? (String(r[mapping.branch] ?? '').trim() || '—') : '—';
    const category = mapping.category ? (String(r[mapping.category] ?? '').trim() || '—') : '—';
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    rows.push({
      ds, date: d, value, qty, branch, category,
      year: d.getFullYear(), month: d.getMonth() + 1, weekdayEn: WD[d.getDay()],
    });
  }

  if (!rows.length) errors.push('No valid rows after normalization');
  return { rows, errors, validRows: rows.length, totalInputRows: raw.length };
}
