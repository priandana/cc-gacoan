import { CycleItem, ColMapping, SheetConfig, DEFAULT_FRESH_COL_MAPPING, DEFAULT_DRY_COL_MAPPING } from './types';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Cache sheet tab titles per spreadsheetId to avoid redundant network calls
const tabTitleCache = new Map<string, string[]>();

function getColMapping(config: SheetConfig, source: 'fresh' | 'dry'): ColMapping {
  if (source === 'fresh') {
    return config.freshColMapping ?? config.colMapping ?? DEFAULT_FRESH_COL_MAPPING;
  }
  return config.dryColMapping ?? config.colMapping ?? DEFAULT_DRY_COL_MAPPING;
}

/**
 * Ambil daftar nama tab sheet dari Google Spreadsheet (cached)
 */
export async function getSheetTabs(
  spreadsheetId: string,
  apiKey: string
): Promise<string[]> {
  if (tabTitleCache.has(spreadsheetId)) {
    return tabTitleCache.get(spreadsheetId)!;
  }

  try {
    const url = `${SHEETS_BASE}/${spreadsheetId}?key=${apiKey}&fields=sheets.properties.title`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const titles: string[] = (data.sheets || []).map((s: { properties: { title: string } }) => s.properties.title);
    tabTitleCache.set(spreadsheetId, titles);
    return titles;
  } catch (e) {
    console.warn('[SheetAPI] Error fetching sheet tabs:', e);
    return [];
  }
}

/**
 * Match date against available tabs in spreadsheet
 */
function resolveTabFromList(date: number, tabs: string[]): string | null {
  if (tabs.length === 0) return String(date);

  const dateStr = String(date);
  const datePad = String(date).padStart(2, '0');

  if (tabs.includes(dateStr)) return dateStr;
  if (tabs.includes(datePad)) return datePad;

  const match = tabs.find(t => {
    const trimmed = t.trim().toLowerCase();
    return (
      trimmed === dateStr ||
      trimmed === datePad ||
      trimmed.startsWith(`${dateStr}-`) ||
      trimmed.startsWith(`${datePad}-`) ||
      trimmed.startsWith(`${dateStr} `) ||
      trimmed.startsWith(`${datePad} `)
    );
  });

  return match || null;
}

/**
 * Fetch raw sheet data
 */
async function fetchSheet(
  spreadsheetId: string,
  sheetName: string,
  colRange: string,
  apiKey: string
): Promise<string[][]> {
  const range = `'${sheetName}'!${colRange}`;
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.values || [];
}

/**
 * Find data start row
 */
function findDataStartRow(
  rows: string[][],
  colMapping: ColMapping,
  configuredStart: number
): number {
  const searchFrom = Math.max(0, configuredStart - 3);
  const searchTo = Math.min(rows.length, configuredStart + 8);

  for (let i = searchFrom; i < searchTo; i++) {
    const row = rows[i];
    if (!row) continue;

    const customerVal = (row[colMapping.customer] || '').trim().toLowerCase();
    if (
      customerVal &&
      customerVal !== 'customer' &&
      customerVal !== 'costumer' &&
      customerVal !== 'pelanggan' &&
      customerVal !== 'consumers'
    ) {
      return i;
    }

    const hasGacoan = row.some(cell => (cell || '').toLowerCase().includes('gacoan'));
    if (hasGacoan) {
      return i;
    }
  }

  return configuredStart - 1;
}

/**
 * Header auto-detection (first match wins)
 */
function autoDetectColMapping(rows: string[][], fallback: ColMapping): ColMapping {
  const detected: Partial<ColMapping> = {};

  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const val = (row[c] || '').trim().toLowerCase();
      if (!val) continue;

      if (val === 'location' || val === 'lokasi') {
        if (detected.location === undefined) detected.location = c;
      } else if (val === 'sku code' || val === 'sku' || val === 'kode sku') {
        if (detected.sku === undefined) detected.sku = c;
      } else if (val === 'desc' || val === 'description' || val === 'deskripsi') {
        if (detected.desc === undefined) detected.desc = c;
      } else if (val === 'exp date' || val === 'exp' || val === 'expired') {
        if (detected.expDate === undefined) detected.expDate = c;
      } else if (val === 'qty' || val === 'quantity') {
        if (detected.qty === undefined) detected.qty = c;
      } else if (val === 'uom' || val === 'satuan') {
        if (detected.uom === undefined) detected.uom = c;
      } else if (val === 'customer' || val === 'costumer' || val === 'pelanggan') {
        if (detected.customer === undefined) detected.customer = c;
      }
    }
  }

  return {
    no: detected.no ?? fallback.no,
    location: detected.location ?? fallback.location,
    sku: detected.sku ?? fallback.sku,
    desc: detected.desc ?? fallback.desc,
    expDate: detected.expDate ?? fallback.expDate,
    qty: detected.qty ?? fallback.qty,
    uom: detected.uom ?? fallback.uom,
    customer: detected.customer ?? fallback.customer,
  };
}

/**
 * Parse rows
 */
function parseRows(
  rows: string[][],
  source: 'fresh' | 'dry',
  config: SheetConfig
): CycleItem[] {
  const fallbackMapping = getColMapping(config, source);
  const colMapping = autoDetectColMapping(rows, fallbackMapping);
  const configuredStart = source === 'fresh' ? config.freshRowStart : config.dryRowStart;

  const dataStartIndex = findDataStartRow(rows, colMapping, configuredStart);
  const dataRows = rows.slice(dataStartIndex);

  const items: CycleItem[] = [];

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    const desc = (row[colMapping.desc] || '').trim();
    const sku = (row[colMapping.sku] || '').trim();

    if (!desc && !sku) continue;

    let foundCustomer = '';
    let isGacoan = false;
    for (let ci = 0; ci < row.length; ci++) {
      const val = (row[ci] || '').trim();
      if (val.toLowerCase().includes('gacoan')) {
        isGacoan = true;
        foundCustomer = val;
        break;
      }
    }

    if (!isGacoan) continue;

    const qtyRaw = row[colMapping.qty] || '0';
    const qty = parseFloat(qtyRaw.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

    items.push({
      no: (row[colMapping.no] || '').trim(),
      location: (row[colMapping.location] || '').trim(),
      sku: sku,
      desc: desc,
      expDate: (row[colMapping.expDate] || '').trim(),
      qty: qty,
      uom: (row[colMapping.uom] || '').trim(),
      customer: foundCustomer,
      source,
    });
  }

  return items;
}

/**
 * Main fetch untuk 1 tanggal
 */
export async function fetchCycleData(
  date: number,
  config: SheetConfig
): Promise<CycleItem[]> {
  const results: CycleItem[] = [];

  // Fresh
  if (config.freshSpreadsheetId) {
    try {
      const tabs = await getSheetTabs(config.freshSpreadsheetId, config.apiKey);
      const targetSheet = resolveTabFromList(date, tabs);
      if (targetSheet) {
        const rows = await fetchSheet(
          config.freshSpreadsheetId,
          targetSheet,
          config.freshColRange,
          config.apiKey
        );
        const items = parseRows(rows, 'fresh', config);
        results.push(...items);
      }
    } catch (e: unknown) {
      console.warn(`[SheetAPI] WH Fresh fetch notice for date ${date}:`, e);
    }
  }

  // Dry
  if (config.drySpreadsheetId) {
    try {
      const tabs = await getSheetTabs(config.drySpreadsheetId, config.apiKey);
      const targetSheet = resolveTabFromList(date, tabs);
      if (targetSheet) {
        const rows = await fetchSheet(
          config.drySpreadsheetId,
          targetSheet,
          config.dryColRange,
          config.apiKey
        );
        const items = parseRows(rows, 'dry', config);
        results.push(...items);
      }
    } catch (e: unknown) {
      console.warn(`[SheetAPI] WH Dry fetch notice for date ${date}:`, e);
    }
  }

  return results;
}

/**
 * Batched fetch untuk akumulasi matrix (menghindari Google API 429 Rate Limit)
 */
export async function fetchAllDatesCycleData(
  dates: number[],
  config: SheetConfig
): Promise<{ date: number; items: CycleItem[] }[]> {
  // Pre-load tab titles once
  if (config.freshSpreadsheetId) await getSheetTabs(config.freshSpreadsheetId, config.apiKey);
  if (config.drySpreadsheetId) await getSheetTabs(config.drySpreadsheetId, config.apiKey);

  const results: { date: number; items: CycleItem[] }[] = [];

  // Chunk in batches of 4 dates to respect API rate limits
  const BATCH_SIZE = 4;
  for (let i = 0; i < dates.length; i += BATCH_SIZE) {
    const batch = dates.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (d) => {
        const items = await fetchCycleData(d, config);
        return { date: d, items };
      })
    );
    results.push(...batchResults);
  }

  return results;
}
