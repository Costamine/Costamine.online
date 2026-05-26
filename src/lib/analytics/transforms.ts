import { SalesRow, Filters, Aggregations } from './types';

export function applyFilters(rows: SalesRow[], f: Filters): SalesRow[] {
  return rows.filter(r => {
    if (f.from && r.date < f.from) return false;
    if (f.to && r.date > f.to) return false;
    if (f.branch !== 'all' && r.branch !== f.branch) return false;
    if (f.category !== 'all' && r.category !== f.category) return false;
    return true;
  });
}

const WD_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function computeAggregations(rows: SalesRow[]): Aggregations {
  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const avgUnitPrice = totalQty > 0 ? totalValue / totalQty : 0;

  const dayMap = new Map<string, { value: number; qty: number }>();
  const monthMap = new Map<number, { value: number; qty: number }>();
  const wdMap = new Map<string, number>();
  const branchMap = new Map<string, { value: number; qty: number }>();
  const catMap = new Map<string, { value: number; qty: number }>();
  const monthBranchMap = new Map<string, { value: number; qty: number }>();

  for (const r of rows) {
    const day = dayMap.get(r.ds) || { value: 0, qty: 0 };
    day.value += r.value; day.qty += r.qty; dayMap.set(r.ds, day);

    const mon = monthMap.get(r.month) || { value: 0, qty: 0 };
    mon.value += r.value; mon.qty += r.qty; monthMap.set(r.month, mon);

    wdMap.set(r.weekdayEn, (wdMap.get(r.weekdayEn) || 0) + r.value);

    const br = branchMap.get(r.branch) || { value: 0, qty: 0 };
    br.value += r.value; br.qty += r.qty; branchMap.set(r.branch, br);

    const ct = catMap.get(r.category) || { value: 0, qty: 0 };
    ct.value += r.value; ct.qty += r.qty; catMap.set(r.category, ct);

    const mbKey = `${r.month}|${r.branch}`;
    const mb = monthBranchMap.get(mbKey) || { value: 0, qty: 0 };
    mb.value += r.value; mb.qty += r.qty; monthBranchMap.set(mbKey, mb);
  }

  const daysCount = dayMap.size;
  const dailyAvg = daysCount > 0 ? totalValue / daysCount : 0;

  const byDay = Array.from(dayMap.entries())
    .map(([ds, v]) => ({ ds, ...v }))
    .sort((a, b) => a.ds.localeCompare(b.ds));

  const byMonth = Array.from(monthMap.entries())
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month - b.month);

  const byWeekday = WD_ORDER.map(name => ({ name, value: wdMap.get(name) || 0 }));

  const byBranch = Array.from(branchMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.value - a.value);

  const byCategory = Array.from(catMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.value - a.value);

  const branches = byBranch.map(b => b.name);
  const months = byMonth.map(m => m.month);

  const monthlyByBranch = months.map(month => {
    const row: any = { month };
    branches.forEach(b => { row[b] = monthBranchMap.get(`${month}|${b}`)?.value || 0; });
    return row;
  });
  const monthlyQtyByBranch = months.map(month => {
    const row: any = { month };
    branches.forEach(b => { row[b] = monthBranchMap.get(`${month}|${b}`)?.qty || 0; });
    return row;
  });

  const topCategory = byCategory[0] ? { name: byCategory[0].name, value: byCategory[0].value } : null;
  const wdSorted = [...byWeekday].sort((a, b) => b.value - a.value);
  const topWeekday = wdSorted[0] && wdSorted[0].value > 0 ? wdSorted[0] : null;

  return {
    totalValue, totalQty, avgUnitPrice, dailyAvg, daysCount,
    topCategory, topWeekday,
    byDay, byMonth, byWeekday, byBranch, byCategory,
    monthlyByBranch, monthlyQtyByBranch, branches, months,
  };
}