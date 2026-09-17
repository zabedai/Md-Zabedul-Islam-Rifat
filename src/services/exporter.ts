import * as XLSX from 'xlsx';
import { MarketplaceId, StockImageItem } from '../types';
import { MARKETPLACE_CONFIGS } from './marketplaceRules';

export interface ExportRow {
  Filename: string;
  Title: string;
  Description: string;
  Keywords: string;
  Category: string;
  'Content Type': string;
  'Commercial / Editorial': string;
}

export function prepareExportData(items: StockImageItem[]): ExportRow[] {
  return items.map((item) => {
    const meta = item.metadata;
    return {
      Filename: item.filename,
      Title: meta?.title || '',
      Description: meta?.description || '',
      Keywords: (meta?.keywords || []).join(', '),
      Category: meta?.category || '',
      'Content Type': meta?.contentType || 'Photo',
      'Commercial / Editorial': meta?.commercialEditorial || 'Commercial'
    };
  });
}

/**
 * Generates CSV string with proper escaping and optional UTF-8 BOM
 */
export function generateCSV(items: StockImageItem[], withBOM: boolean = true): string {
  const data = prepareExportData(items);
  if (data.length === 0) return '';

  const headers: (keyof ExportRow)[] = [
    'Filename',
    'Title',
    'Description',
    'Keywords',
    'Category',
    'Content Type'
  ];

  const escapeCSV = (val: string): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const rows: string[] = [];
  rows.push(headers.map((h) => escapeCSV(h)).join(','));

  for (const row of data) {
    const rowValues = headers.map((header) => escapeCSV(row[header]));
    rows.push(rowValues.join(','));
  }

  const csvContent = rows.join('\r\n');
  return withBOM ? '\uFEFF' + csvContent : csvContent;
}

/**
 * Downloads a generated CSV file
 */
export function downloadCSV(items: StockImageItem[], marketplace: MarketplaceId = 'generic', filenamePrefix = 'stock-metadata'): void {
  const csv = generateCSV(items, true);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filenamePrefix}-${marketplace}-${Date.now()}.csv`);
}

/**
 * Downloads a generated XLSX file using SheetJS
 */
export function downloadXLSX(items: StockImageItem[], marketplace: MarketplaceId = 'generic', filenamePrefix = 'stock-metadata'): void {
  const data = prepareExportData(items);
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 25 }, // Filename
    { wch: 45 }, // Title
    { wch: 60 }, // Description
    { wch: 50 }, // Keywords
    { wch: 20 }, // Category
    { wch: 15 }, // Content Type
    { wch: 22 }  // Commercial/Editorial
  ];

  const workbook = XLSX.utils.book_new();
  const sheetName = (MARKETPLACE_CONFIGS[marketplace]?.name || 'Metadata').slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `${filenamePrefix}-${marketplace}-${Date.now()}.xlsx`);
}

/**
 * Generates formatted TXT summary
 */
export function downloadTXT(items: StockImageItem[], filenamePrefix = 'stock-metadata'): void {
  const lines: string[] = [];
  lines.push('====================================================');
  lines.push('STOCK METADATA EXPORT');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Total Items: ${items.length}`);
  lines.push('====================================================\n');

  items.forEach((item, index) => {
    const meta = item.metadata;
    lines.push(`[FILE ${index + 1}/${items.length}] ${item.filename}`);
    lines.push(`TITLE: ${meta?.title || '(none)'}`);
    lines.push(`DESCRIPTION: ${meta?.description || '(none)'}`);
    lines.push(`CATEGORY: ${meta?.category || '(none)'}`);
    lines.push(`CONTENT TYPE: ${meta?.contentType || 'Photo'} (${meta?.commercialEditorial || 'Commercial'})`);
    lines.push(`KEYWORDS (${meta?.keywords?.length || 0}):`);
    lines.push(`${(meta?.keywords || []).join(', ')}`);
    lines.push('----------------------------------------------------\n');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
  triggerDownload(blob, `${filenamePrefix}-${Date.now()}.txt`);
}

/**
 * Copies formatted metadata string to clipboard for quick paste
 */
export async function copyMetadataToClipboard(items: StockImageItem[]): Promise<boolean> {
  if (items.length === 0) return false;

  let text = '';
  if (items.length === 1) {
    const meta = items[0].metadata;
    text = `TITLE:\n${meta?.title || ''}\n\nDESCRIPTION:\n${meta?.description || ''}\n\nKEYWORDS (${meta?.keywords?.length || 0}):\n${(meta?.keywords || []).join(', ')}\n\nCATEGORY:\n${meta?.category || ''}\nCONTENT TYPE: ${meta?.contentType || 'Photo'}`;
  } else {
    text = items
      .map((item, idx) => {
        const meta = item.metadata;
        return `[#${idx + 1}] ${item.filename}\nTitle: ${meta?.title || ''}\nDescription: ${meta?.description || ''}\nKeywords: ${(meta?.keywords || []).join(', ')}\nCategory: ${meta?.category || ''}\nType: ${meta?.contentType || 'Photo'}`;
      })
      .join('\n\n---\n\n');
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.warn('Clipboard write failed:', err);
    return false;
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
