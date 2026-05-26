export type FieldKey = 'date' | 'value' | 'qty' | 'branch' | 'category';

export interface DetectedField {
  field: FieldKey;
  column: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  candidates: { column: string; score: number }[];
}

export type Mapping = Record<FieldKey, string | null>;

const PATTERNS: Record<FieldKey, string[]> = {
  date: ['date', 'تاريخ', 'day', 'يوم', 'datetime', 'time'],
  value: ['value', 'amount', 'sales', 'revenue', 'total', 'price', 'net', 'قيمة', 'القيمة', 'مبيعات', 'صافي', 'اجمالي', 'إجمالي', 'سعر'],
  qty: ['qty', 'quantity', 'count', 'units', 'كمية', 'الكمية', 'عدد'],
  branch: ['branch', 'store', 'location', 'shop', 'outlet', 'فرع', 'الفرع', 'متجر'],
  category: ['category', 'type', 'item', 'product', 'group', 'فئة', 'الفئة', 'صنف', 'منتج', 'نوع'],
};

function normalize(s: string) {
  return String(s).toLowerCase().trim().replace(/[_\-\s]+/g, '');
}

function inferType(values: any[]): 'date' | 'number' | 'string' {
  const sample = values.filter(v => v !== '' && v != null).slice(0, 20);
  if (!sample.length) return 'string';
  let dates = 0, nums = 0;
  for (const v of sample) {
    if (v instanceof Date) { dates++; continue; }
    if (typeof v === 'number') { nums++; continue; }
    const s = String(v).trim();
    if (/^\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}$/.test(s)) dates++;
    else if (!isNaN(parseFloat(s)) && isFinite(+s)) nums++;
  }
  if (dates / sample.length > 0.6) return 'date';
  if (nums / sample.length > 0.7) return 'number';
  return 'string';
}

function nameScore(header: string, patterns: string[]): number {
  const h = normalize(header);
  let best = 0;
  for (const p of patterns) {
    const np = normalize(p);
    if (h === np) best = Math.max(best, 1);
    else if (h.includes(np) || np.includes(h)) best = Math.max(best, 0.7);
  }
  return best;
}

export function autoDetectColumns(headers: string[], rows: Record<string, any>[]): DetectedField[] {
  const types: Record<string, ReturnType<typeof inferType>> = {};
  for (const h of headers) types[h] = inferType(rows.map(r => r[h]));

  const result: DetectedField[] = [];
  const used = new Set<string>();

  (['date', 'value', 'qty', 'branch', 'category'] as FieldKey[]).forEach((field) => {
    const expected = field === 'date' ? 'date' : (field === 'value' || field === 'qty') ? 'number' : 'string';
    const cands = headers.map(h => {
      const ns = nameScore(h, PATTERNS[field]);
      const typeBonus = types[h] === expected ? 0.3 : 0;
      const usedPenalty = used.has(h) ? -0.5 : 0;
      return { column: h, score: Math.max(0, ns + typeBonus + usedPenalty) };
    }).sort((a, b) => b.score - a.score);

    const top = cands[0];
    let confidence: DetectedField['confidence'] = 'none';
    let chosen: string | null = null;
    if (top && top.score >= 0.9) { confidence = 'high'; chosen = top.column; }
    else if (top && top.score >= 0.6) { confidence = 'medium'; chosen = top.column; }
    else if (top && top.score >= 0.3) { confidence = 'low'; chosen = top.column; }
    if (chosen) used.add(chosen);

    result.push({ field, column: chosen, confidence, candidates: cands.slice(0, 5) });
  });

  return result;
}

export function mappingFromDetection(detected: DetectedField[]): Mapping {
  const m: Mapping = { date: null, value: null, qty: null, branch: null, category: null };
  detected.forEach(d => { m[d.field] = d.column; });
  return m;
}

export function isMappingConfident(detected: DetectedField[]): boolean {
  const required = detected.filter(d => d.field === 'date' || d.field === 'value');
  return required.every(d => d.confidence === 'high');
}
