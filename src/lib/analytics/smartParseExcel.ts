import * as XLSX from 'xlsx';

export interface RawSheet {
  headers: string[];
  rows: Record<string, any>[];
  sheetName: string;
  totalRows: number;
}

export async function readExcelFile(file: File): Promise<RawSheet> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows, sheetName, totalRows: rows.length };
}
