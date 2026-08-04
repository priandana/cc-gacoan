// TypeScript types untuk Cycle Count Dashboard

export interface CycleItem {
  no: string;
  location: string;
  sku: string;
  desc: string;
  expDate: string;
  qty: number;
  uom: string;
  customer: string;
  source: 'fresh' | 'dry';
}

export type SourceFilter = 'all' | 'fresh' | 'dry';

export type SortField = 'sku' | 'name' | 'exp' | 'qty' | null;
export type SortDirection = 'asc' | 'desc';

export interface ColMapping {
  no: number;
  location: number;
  sku: number;
  desc: number;
  expDate: number;
  qty: number;
  uom: number;
  customer: number;
}

export interface SheetConfig {
  apiKey: string;
  freshSpreadsheetId: string;
  drySpreadsheetId: string;
  freshRowStart: number;
  dryRowStart: number;
  freshColRange: string;
  dryColRange: string;
  // Mapping kolom terpisah untuk Fresh dan Dry
  freshColMapping: ColMapping;
  dryColMapping: ColMapping;
  // Legacy (untuk backward compat)
  colMapping?: ColMapping;
}

// WH FRESH: No | Aisle | Bay | Level | Padis/Slot | ExtraCol | Location | SKU Code | Desc | Exp Date | Qty | UOM | COSTUMER
// Index:     0    1       2     3        4             5           6          7          8      9          10    11    12
export const DEFAULT_FRESH_COL_MAPPING: ColMapping = {
  no: 0,
  location: 6,
  sku: 7,
  desc: 8,
  expDate: 9,
  qty: 10,
  uom: 11,
  customer: 12,
};

// WH DRY: No | Aisle | Bay | Level | Posisi/Slot | Location | SKU Code | Desc | Exp Date | Qty | UOM | (Empty) | Customer
// Index:   0    1       2     3        4             5          6         7      8           9    10     11        12
export const DEFAULT_DRY_COL_MAPPING: ColMapping = {
  no: 0,
  location: 5,
  sku: 6,
  desc: 7,
  expDate: 8,
  qty: 9,
  uom: 10,
  customer: 12,
};


export const DEFAULT_CONFIG: SheetConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
  freshSpreadsheetId: process.env.NEXT_PUBLIC_FRESH_SPREADSHEET_ID || '',
  drySpreadsheetId: process.env.NEXT_PUBLIC_DRY_SPREADSHEET_ID || '',
  freshRowStart: Number(process.env.NEXT_PUBLIC_FRESH_ROW_START) || 6,
  dryRowStart: Number(process.env.NEXT_PUBLIC_DRY_ROW_START) || 7,
  freshColRange: process.env.NEXT_PUBLIC_FRESH_COL_RANGE || 'A:P',
  dryColRange: process.env.NEXT_PUBLIC_DRY_COL_RANGE || 'A:P',
  freshColMapping: DEFAULT_FRESH_COL_MAPPING,
  dryColMapping: DEFAULT_DRY_COL_MAPPING,
};
