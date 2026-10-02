import { CycleItem, SheetConfig, Period, DEFAULT_CONFIG, DEFAULT_FRESH_COL_MAPPING, DEFAULT_DRY_COL_MAPPING } from './types';

const CONFIG_KEY = 'cycle_count_config';

/** Simpan config ke localStorage */
export function saveConfig(config: SheetConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
}

/** Load config dari localStorage */
export function loadConfig(): SheetConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const saved = JSON.parse(raw);

    // Merge saved periods dengan default
    const mergedPeriods = DEFAULT_CONFIG.periods.map(def => {
      const savedPeriod = (saved.periods || []).find((p: Period) => p.id === def.id);
      if (!savedPeriod) return def;
      return {
        ...def,
        ...savedPeriod,
        freshSpreadsheetId: savedPeriod.freshSpreadsheetId || def.freshSpreadsheetId,
        drySpreadsheetId: savedPeriod.drySpreadsheetId !== undefined ? savedPeriod.drySpreadsheetId : def.drySpreadsheetId,
      };
    });

    const activePeriodId = saved.activePeriodId || DEFAULT_CONFIG.activePeriodId;
    const activePeriod = mergedPeriods.find(p => p.id === activePeriodId) || mergedPeriods[0];

    return {
      ...DEFAULT_CONFIG,
      ...saved,
      apiKey: saved.apiKey || DEFAULT_CONFIG.apiKey,
      activePeriodId: activePeriod.id,
      activeMonth: activePeriod.month,
      activeYear: activePeriod.year,
      freshSpreadsheetId: activePeriod.freshSpreadsheetId || saved.freshSpreadsheetId || DEFAULT_CONFIG.freshSpreadsheetId,
      drySpreadsheetId: activePeriod.drySpreadsheetId !== undefined ? activePeriod.drySpreadsheetId : (saved.drySpreadsheetId || DEFAULT_CONFIG.drySpreadsheetId),
      periods: mergedPeriods,
      freshColMapping: { ...DEFAULT_FRESH_COL_MAPPING, ...(saved.freshColMapping || {}) },
      dryColMapping: { ...DEFAULT_DRY_COL_MAPPING, ...(saved.dryColMapping || {}) },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Ekstrak Spreadsheet ID jika user mem-paste full URL Google Sheets */
export function extractSpreadsheetId(val: string): string {
  const trimmed = val.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return trimmed;
}

/** Format tanggal untuk display */
export function formatExpDate(raw: string): { display: string; isWarning: boolean; isExpired: boolean } {
  if (!raw || raw === '-' || raw.trim() === '') {
    return { display: '—', isWarning: false, isExpired: false };
  }

  // Coba parse berbagai format tanggal
  let date: Date | null = null;

  // Format: DD-MMM-YYYY (e.g. 18-Jan-2026)
  const mmmMatch = raw.match(/(\d{1,2})[- /]([A-Za-z]{3})[- /](\d{4})/);
  if (mmmMatch) {
    date = new Date(`${mmmMatch[2]} ${mmmMatch[1]}, ${mmmMatch[3]}`);
  }

  // Format: DD/MM/YYYY atau DD-MM-YYYY
  if (!date) {
    const numMatch = raw.match(/(\d{1,2})[- /](\d{1,2})[- /](\d{4})/);
    if (numMatch) {
      date = new Date(`${numMatch[3]}-${numMatch[2].padStart(2, '0')}-${numMatch[1].padStart(2, '0')}`);
    }
  }

  // Format: YYYY-MM-DD (ISO)
  if (!date) {
    const isoMatch = raw.match(/(\d{4})[- /](\d{1,2})[- /](\d{1,2})/);
    if (isoMatch) {
      date = new Date(`${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`);
    }
  }

  if (!date || isNaN(date.getTime())) {
    return { display: raw, isWarning: false, isExpired: false };
  }

  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const display = date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return {
    display,
    isWarning: diffDays >= 0 && diffDays <= 30,
    isExpired: diffDays < 0,
  };
}

/** Filter items berdasarkan source */
export function filterBySource(items: CycleItem[], source: string): CycleItem[] {
  if (source === 'all') return items;
  return items.filter((item) => item.source === source);
}

/** Filter items berdasarkan search query */
export function filterBySearch(items: CycleItem[], query: string): CycleItem[] {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.desc.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q)
  );
}

/** Hitung total qty */
export function totalQty(items: CycleItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

/** Hitung expired / close to expiry */
export function countExpiredOrClose(items: CycleItem[]): number {
  return items.filter((item) => {
    const { isWarning, isExpired } = formatExpDate(item.expDate);
    return isWarning || isExpired;
  }).length;
}

/** Get today's date number (1-31) */
export function getTodayDate(): number {
  return new Date().getDate();
}

/** Format angka qty dengan pemisah ribuan */
export function formatQty(qty: number): string {
  return qty.toLocaleString('id-ID');
}

/** Hitung ringkasan statistik untuk items */
export function calculateStats(items: CycleItem[]) {
  let totalQty = 0;
  let expiredCount = 0;
  let warningCount = 0;

  for (const item of items) {
    totalQty += item.qty;
    const expInfo = formatExpDate(item.expDate);
    if (expInfo.isExpired) expiredCount++;
    else if (expInfo.isWarning) warningCount++;
  }

  return {
    totalItems: items.length,
    totalQty,
    expiredCount,
    warningCount,
  };
}

