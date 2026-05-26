/**
 * Universal data profiler — analyzes any tabular dataset and infers
 * column types, semantic roles, distributions, and suggested visualisations.
 * No assumption is made about column names; detection is data-driven.
 */

export type ColumnType = 'date' | 'number' | 'text' | 'categorical' | 'boolean' | 'mixed' | 'empty';
export type ColumnRole = 'time' | 'measure' | 'dimension' | 'identifier' | 'flag' | 'unknown';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  role: ColumnRole;
  count: number;
  missing: number;
  unique: number;
  uniqueRatio: number;
  // Number stats
  min?: number;
  max?: number;
  sum?: number;
  mean?: number;
  median?: number;
  stdev?: number;
  // Date stats
  minDate?: Date;
  maxDate?: Date;
  // Top values (for categorical/text)
  topValues?: { value: string; count: number }[];
  // Outliers (for numbers, IQR-based)
  outliers?: number;
  sample: any[];
}

export interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  timeColumn?: string;
  measures: string[];
  dimensions: string[];
  suggestedCharts: SuggestedChart[];
}

export interface SuggestedChart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'histogram' | 'table' | 'area';
  title: string;
  x: string;
  y?: string;
  groupBy?: string;
  reason: string;
}

const DATE_REGEX = [
  /^\d{4}-\d{1,2}-\d{1,2}/,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}/,
  /^\d{1,2}-\d{1,2}-\d{2,4}/,
  /^\d{4}\/\d{1,2}\/\d{1,2}/,
];

function isDateLike(v: any): boolean {
  if (v instanceof Date && !isNaN(+v)) return true;
  if (typeof v === 'number') {
    // Excel serial date range (1900-01-01 .. 2099)
    return v > 20000 && v < 80000;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return false;
    if (DATE_REGEX.some(r => r.test(s))) return true;
    const t = Date.parse(s);
    return !isNaN(t) && s.length >= 6 && /\d/.test(s) && /[-/\s:]/.test(s);
  }
  return false;
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[,،\s]/g, '').replace(/[^\d.\-eE]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.') return null;
    const n = Number(cleaned);
    return isFinite(n) ? n : null;
  }
  return null;
}

function toDate(v: any): Date | null {
  if (v instanceof Date && !isNaN(+v)) return v;
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    // Excel serial → JS date
    const utc = (v - 25569) * 86400 * 1000;
    const d = new Date(utc);
    return isNaN(+d) ? null : d;
  }
  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (!isNaN(t)) return new Date(t);
  }
  return null;
}

function isBoolLike(v: any): boolean {
  if (typeof v === 'boolean') return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return ['true', 'false', 'yes', 'no', 'نعم', 'لا', '0', '1'].includes(s);
  }
  return false;
}

function detectType(values: any[]): ColumnType {
  const non = values.filter(v => v !== null && v !== undefined && v !== '');
  if (!non.length) return 'empty';
  let nums = 0, dates = 0, bools = 0, texts = 0;
  for (const v of non) {
    if (isDateLike(v)) { dates++; continue; }
    if (toNumber(v) !== null) { nums++; continue; }
    if (isBoolLike(v)) { bools++; continue; }
    texts++;
  }
  const total = non.length;
  const ratio = (n: number) => n / total;
  if (ratio(dates) >= 0.8) return 'date';
  if (ratio(nums) >= 0.85) return 'number';
  if (ratio(bools) >= 0.85) return 'boolean';
  if (ratio(texts) >= 0.5) {
    const unique = new Set(non.map(v => String(v))).size;
    if (unique <= Math.max(20, total * 0.3)) return 'categorical';
    return 'text';
  }
  return 'mixed';
}

function suggestRole(profile: ColumnProfile): ColumnRole {
  if (profile.type === 'date') return 'time';
  if (profile.type === 'number') {
    // identifier if unique ratio very high and integer-only with no decimals
    if (profile.uniqueRatio > 0.9 && profile.count > 5) return 'identifier';
    return 'measure';
  }
  if (profile.type === 'boolean') return 'flag';
  if (profile.type === 'categorical') return 'dimension';
  if (profile.type === 'text') {
    if (profile.uniqueRatio > 0.9) return 'identifier';
    return 'dimension';
  }
  return 'unknown';
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  return sorted[base];
}

function profileColumn(name: string, values: any[]): ColumnProfile {
  const total = values.length;
  const non = values.filter(v => v !== null && v !== undefined && v !== '');
  const missing = total - non.length;
  const type = detectType(values);
  const uniqueSet = new Set(non.map(v => (v instanceof Date ? v.toISOString() : String(v))));
  const unique = uniqueSet.size;
  const uniqueRatio = total ? unique / total : 0;

  const profile: ColumnProfile = {
    name,
    type,
    role: 'unknown',
    count: total,
    missing,
    unique,
    uniqueRatio,
    sample: non.slice(0, 5),
  };

  if (type === 'number') {
    const nums = non.map(toNumber).filter((n): n is number => n !== null);
    if (nums.length) {
      const sorted = [...nums].sort((a, b) => a - b);
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / nums.length;
      const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
      profile.min = sorted[0];
      profile.max = sorted[sorted.length - 1];
      profile.sum = sum;
      profile.mean = mean;
      profile.median = quantile(sorted, 0.5);
      profile.stdev = Math.sqrt(variance);
      const q1 = quantile(sorted, 0.25);
      const q3 = quantile(sorted, 0.75);
      const iqr = q3 - q1;
      const lo = q1 - 1.5 * iqr;
      const hi = q3 + 1.5 * iqr;
      profile.outliers = nums.filter(n => n < lo || n > hi).length;
    }
  }

  if (type === 'date') {
    const dates = non.map(toDate).filter((d): d is Date => !!d);
    if (dates.length) {
      const ts = dates.map(d => +d);
      profile.minDate = new Date(Math.min(...ts));
      profile.maxDate = new Date(Math.max(...ts));
    }
  }

  if (type === 'categorical' || type === 'text' || type === 'boolean') {
    const counts = new Map<string, number>();
    for (const v of non) {
      const k = String(v);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    profile.topValues = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([value, count]) => ({ value, count }));
  }

  profile.role = suggestRole(profile);
  return profile;
}

function suggestCharts(cols: ColumnProfile[], rowCount: number): SuggestedChart[] {
  const out: SuggestedChart[] = [];
  const time = cols.find(c => c.role === 'time');
  const measures = cols.filter(c => c.role === 'measure');
  const dimensions = cols.filter(c => c.role === 'dimension' && c.unique >= 2 && c.unique <= 50);

  // Time series for each measure
  if (time && measures.length) {
    measures.slice(0, 3).forEach((m, i) => {
      out.push({
        id: `line-${i}`,
        type: 'line',
        title: `${m.name} عبر الزمن`,
        x: time.name,
        y: m.name,
        reason: 'Date column + numeric measure detected',
      });
    });
  }

  // Bar charts: top categories per measure
  if (dimensions.length && measures.length) {
    dimensions.slice(0, 2).forEach((d, di) => {
      measures.slice(0, 2).forEach((m, mi) => {
        out.push({
          id: `bar-${di}-${mi}`,
          type: 'bar',
          title: `${m.name} حسب ${d.name}`,
          x: d.name,
          y: m.name,
          reason: 'Categorical dimension + numeric measure',
        });
      });
    });
  }

  // Pie for distribution of small categorical (no measure)
  dimensions.filter(d => d.unique <= 8).slice(0, 1).forEach((d, i) => {
    out.push({
      id: `pie-${i}`,
      type: 'pie',
      title: `توزيع ${d.name}`,
      x: d.name,
      reason: 'Small categorical → distribution',
    });
  });

  // Histogram for measures without time
  if (!time) {
    measures.slice(0, 2).forEach((m, i) => {
      out.push({
        id: `hist-${i}`,
        type: 'histogram',
        title: `توزيع ${m.name}`,
        x: m.name,
        reason: 'Numeric column distribution',
      });
    });
  }

  // Fallback table
  if (!out.length) {
    out.push({
      id: 'table',
      type: 'table',
      title: 'عرض البيانات',
      x: cols[0]?.name ?? '',
      reason: `Could not infer charts from ${rowCount} rows`,
    });
  }

  return out;
}

export function profileDataset(rows: Record<string, any>[]): DatasetProfile {
  if (!rows.length) {
    return {
      rowCount: 0,
      columnCount: 0,
      columns: [],
      measures: [],
      dimensions: [],
      suggestedCharts: [],
    };
  }
  const headerSet = new Set<string>();
  rows.forEach(r => Object.keys(r).forEach(k => headerSet.add(k)));
  const headers = Array.from(headerSet);

  const columns = headers.map(h => profileColumn(h, rows.map(r => r[h])));

  const time = columns.find(c => c.role === 'time');
  const measures = columns.filter(c => c.role === 'measure').map(c => c.name);
  const dimensions = columns.filter(c => c.role === 'dimension').map(c => c.name);

  return {
    rowCount: rows.length,
    columnCount: columns.length,
    columns,
    timeColumn: time?.name,
    measures,
    dimensions,
    suggestedCharts: suggestCharts(columns, rows.length),
  };
}

/* ───────────────── Insights ───────────────── */

export interface SmartInsight {
  kind: 'top' | 'bottom' | 'trend' | 'frequent' | 'outlier' | 'distribution';
  title: string;
  description: string;
  value?: string;
  column: string;
}

export function generateSmartInsights(rows: Record<string, any>[], profile: DatasetProfile): SmartInsight[] {
  const insights: SmartInsight[] = [];

  for (const col of profile.columns) {
    if (col.type === 'number' && col.mean !== undefined) {
      insights.push({
        kind: 'top',
        column: col.name,
        title: `أعلى قيمة في ${col.name}`,
        description: `أعلى قيمة مسجلة هي ${formatNum(col.max!)} والمتوسط ${formatNum(col.mean)}`,
        value: formatNum(col.max!),
      });
      if ((col.outliers ?? 0) > 0) {
        insights.push({
          kind: 'outlier',
          column: col.name,
          title: `قيم شاذة في ${col.name}`,
          description: `تم اكتشاف ${col.outliers} قيمة شاذة (Outliers) قد تستحق المراجعة`,
          value: String(col.outliers),
        });
      }
    }
    if ((col.type === 'categorical' || col.type === 'text') && col.topValues?.length) {
      const top = col.topValues[0];
      insights.push({
        kind: 'frequent',
        column: col.name,
        title: `الأكثر تكراراً في ${col.name}`,
        description: `"${top.value}" تكررت ${top.count} مرة`,
        value: top.value,
      });
    }
  }

  // Trend detection on first measure + time
  if (profile.timeColumn && profile.measures.length) {
    const t = profile.timeColumn;
    const m = profile.measures[0];
    const series = rows
      .map(r => ({ d: toDate(r[t]), v: toNumber(r[m]) }))
      .filter(p => p.d && p.v !== null) as { d: Date; v: number }[];
    series.sort((a, b) => +a.d - +b.d);
    if (series.length >= 3) {
      const half = Math.floor(series.length / 2);
      const first = series.slice(0, half).reduce((a, b) => a + b.v, 0) / half;
      const second = series.slice(-half).reduce((a, b) => a + b.v, 0) / half;
      const pct = first ? ((second - first) / Math.abs(first)) * 100 : 0;
      insights.push({
        kind: 'trend',
        column: m,
        title: pct >= 0 ? `اتجاه تصاعدي في ${m}` : `اتجاه تنازلي في ${m}`,
        description: `${m} ${pct >= 0 ? 'ارتفع' : 'انخفض'} بنسبة ${Math.abs(pct).toFixed(1)}% بين النصف الأول والثاني`,
        value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
      });
    }
  }

  return insights.slice(0, 8);
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n * 100) / 100 + '';
}

/* Helpers exported for renderers */
export { toNumber, toDate };