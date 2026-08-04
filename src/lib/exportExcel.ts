import ExcelJS from 'exceljs';
import { formatExpDate } from './utils';

export interface ExportRow {
  sku: string;
  desc: string;
  expTerdekat: string;
  qtyByDate: Record<number, number>;
  totalQty: number;
  source?: string;
}

/**
 * Helper to build one styled worksheet inside the Excel workbook
 */
/** Convert 1-based column index to Excel letter (A, B, ..., Z, AA, AB, ...) */
function colIndexToLetter(n: number): string {
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function buildWorksheet(
  workbook: ExcelJS.Workbook,
  sheetTitle: string,
  tabColorHex: string,
  headerBgHex: string,
  rows: ExportRow[],
  selectedDate: number
) {
  const worksheet = workbook.addWorksheet(sheetTitle, {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 3, ySplit: 7 }],
  });

  // Set colored tab in Excel!
  worksheet.properties.tabColor = { argb: `FF${tabColorHex}` };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Row 1: Title Banner
  worksheet.mergeCells('A1:AJ1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `LAPORAN AKUMULASI STOK & EXPIRED — GACOAN PADALARANG`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF11101D' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(1).height = 36;

  // Row 2: Subtitle Info
  worksheet.mergeCells('A2:AJ2');
  const subTitleCell = worksheet.getCell('A2');
  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  subTitleCell.value = `Kategori Sheet: ${sheetTitle}  |  Periode: 1 - 31 Agustus 2026  |  Tanggal Pilihan: ${selectedDate} Agustus 2026  |  Di-export: ${nowStr}`;
  subTitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(2).height = 22;

  // Row 3 & 4: Top Executive KPI Cards inside Excel!
  worksheet.getRow(3).height = 18;
  worksheet.getRow(4).height = 28;

  // Calculate totals for KPI cards
  const totalSkuCount = rows.length;
  const grandTotalUnits = rows.reduce((sum, r) => sum + r.totalQty, 0);

  // KPI Card 1: TOTAL SKU
  worksheet.mergeCells('A3:C3');
  worksheet.mergeCells('A4:C4');
  const kpi1Title = worksheet.getCell('A3');
  kpi1Title.value = '📦 TOTAL PRODUK SKU';
  kpi1Title.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF475569' } };
  kpi1Title.alignment = { vertical: 'middle', horizontal: 'center' };
  kpi1Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  const kpi1Val = worksheet.getCell('A4');
  kpi1Val.value = `${totalSkuCount} Item SKU`;
  kpi1Val.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  kpi1Val.alignment = { vertical: 'middle', horizontal: 'center' };
  kpi1Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

  // KPI Card 2: TOTAL AKUMULASI FISIK
  worksheet.mergeCells('D3:G3');
  worksheet.mergeCells('D4:G4');
  const kpi2Title = worksheet.getCell('D3');
  kpi2Title.value = '📊 TOTAL AKUMULASI FISIK (31 HARI)';
  kpi2Title.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0A0A0A' } };
  kpi2Title.alignment = { vertical: 'middle', horizontal: 'center' };
  kpi2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${headerBgHex}` } };

  const kpi2Val = worksheet.getCell('D4');
  kpi2Val.value = grandTotalUnits;
  kpi2Val.numFmt = '#,##0 "Qty"';
  kpi2Val.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0A0A0A' } };
  kpi2Val.alignment = { vertical: 'middle', horizontal: 'center' };
  kpi2Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };

  // KPI Card 3: GUDANG TARGET
  worksheet.mergeCells('H3:K3');
  worksheet.mergeCells('H4:K4');
  const kpi3Title = worksheet.getCell('H3');
  kpi3Title.value = '🏭 LOKASI GUDANG';
  kpi3Title.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF475569' } };
  kpi3Title.alignment = { vertical: 'middle', horizontal: 'center' };
  kpi3Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  const kpi3Val = worksheet.getCell('H4');
  kpi3Val.value = sheetTitle;
  kpi3Val.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } };
  kpi3Val.alignment = { vertical: 'middle', horizontal: 'center' };
  kpi3Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

  // Apply card borders
  ['A3', 'A4', 'D3', 'D4', 'H3', 'H4'].forEach(cellPos => {
    const cell = worksheet.getCell(cellPos);
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0A0A0A' } },
      bottom: { style: 'medium', color: { argb: 'FF0A0A0A' } },
      left: { style: 'medium', color: { argb: 'FF0A0A0A' } },
      right: { style: 'medium', color: { argb: 'FF0A0A0A' } },
    };
  });

  // Row 5: Spacing
  worksheet.getRow(5).height = 10;

  // Row 6: Table Header
  const headerValues = ['NO', 'SKU CODE', 'DESKRIPSI PRODUK', 'EXP TERDEKAT', ...days.map(d => `${d} AGS`), 'TOTAL STOK'];
  const headerRow = worksheet.getRow(6);
  headerRow.values = headerValues;
  headerRow.height = 28;

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0A0A0A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colNumber === 36 ? 'FFFEF08A' : `FF${headerBgHex}` },
    };
    cell.alignment = { vertical: 'middle', horizontal: colNumber <= 3 ? 'left' : 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0A0A0A' } },
      bottom: { style: 'medium', color: { argb: 'FF0A0A0A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Data Rows (Row 7+)
  let startDataRow = 7;
  rows.forEach((row, idx) => {
    const rowNumber = startDataRow + idx;
    const expInfo = formatExpDate(row.expTerdekat);
    const dayValues = days.map(d => row.qtyByDate[d] || 0);

    const dataRow = worksheet.getRow(rowNumber);
    dataRow.values = [
      idx + 1,
      row.sku,
      row.desc,
      expInfo.display || row.expTerdekat || '—',
      ...dayValues,
      row.totalQty,
    ];
    dataRow.height = 22;

    const isEven = idx % 2 === 1;
    const bgHex = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    dataRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgHex } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF94A3B8' } };
      } else if (colNumber === 2 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      } else if (colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (expInfo.isExpired) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
        } else if (expInfo.isWarning) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFD97706' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
        }
      } else if (colNumber >= 5 && colNumber <= 35) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        const val = Number(cell.value) || 0;
        if (val === 0) {
          cell.value = '-';
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FFCBD5E1' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.numFmt = '#,##0';
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        }
      } else if (colNumber === 36) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0';
        cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
      }
    });
  });

  // Summary Total Row at Bottom
  const totalRowNumber = startDataRow + rows.length;
  const totalRow = worksheet.getRow(totalRowNumber);
  totalRow.height = 26;

  worksheet.mergeCells(`A${totalRowNumber}:D${totalRowNumber}`);
  const labelCell = worksheet.getCell(`A${totalRowNumber}`);
  labelCell.value = 'TOTAL AKUMULASI STOK';
  labelCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0A0A0A' } };
  labelCell.alignment = { vertical: 'middle', horizontal: 'center' };

  days.forEach((_d, idx) => {
    const colIdx = 5 + idx;
    const colLetter = colIndexToLetter(colIdx);
    const cell = totalRow.getCell(colIdx);
    cell.value = { formula: `SUM(${colLetter}7:${colLetter}${totalRowNumber - 1})` };
    cell.numFmt = '#,##0';
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0A0A0A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
  });

  const grandTotalCell = totalRow.getCell(36);
  grandTotalCell.value = { formula: `SUM(AJ7:AJ${totalRowNumber - 1})` };
  grandTotalCell.numFmt = '#,##0';
  grandTotalCell.font = { name: 'Calibri', size: 11.5, bold: true, color: { argb: 'FF0A0A0A' } };
  grandTotalCell.alignment = { vertical: 'middle', horizontal: 'right' };

  totalRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0A0A0A' } },
      bottom: { style: 'double', color: { argb: 'FF0A0A0A' } },
      left: { style: 'thin', color: { argb: 'FF0A0A0A' } },
      right: { style: 'thin', color: { argb: 'FF0A0A0A' } },
    };
  });

  // Column Widths
  worksheet.getColumn(1).width = 6;  // NO
  worksheet.getColumn(2).width = 14; // SKU
  worksheet.getColumn(3).width = 38; // DESC
  worksheet.getColumn(4).width = 16; // EXP
  for (let c = 5; c <= 35; c++) {
    worksheet.getColumn(c).width = 11;
  }
  worksheet.getColumn(36).width = 16; // Total Qty
}

/**
 * Main export function: support multi-tab export when ALL is selected
 */
export async function exportMatrixToExcel(
  rows: ExportRow[],
  sourceLabel: string,
  selectedDate: number
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GACOAN Cycle Count Intelligence';
  workbook.created = new Date();

  const isAll = sourceLabel.includes('SEMUA') || sourceLabel.includes('ALL');
  const isFresh = sourceLabel.includes('FRESH');
  const isDry = sourceLabel.includes('DRY');

  if (isAll) {
    // 1. Sheet 1: ALL Combined Summary
    buildWorksheet(workbook, 'SUMMARY ALL GUDANG', 'FFD60A', 'FFD60A', rows, selectedDate);

    // 2. Sheet 2: WH FRESH
    const freshRows = rows.filter(r => r.source === 'fresh' || !r.source);
    if (freshRows.length > 0) {
      buildWorksheet(workbook, 'WH FRESH', '38BDF8', '38BDF8', freshRows, selectedDate);
    }

    // 3. Sheet 3: WH DRY
    const dryRows = rows.filter(r => r.source === 'dry' || !r.source);
    if (dryRows.length > 0) {
      buildWorksheet(workbook, 'WH DRY', 'FB923C', 'FB923C', dryRows, selectedDate);
    }
  } else if (isFresh) {
    buildWorksheet(workbook, 'WH FRESH', '38BDF8', '38BDF8', rows, selectedDate);
  } else if (isDry) {
    buildWorksheet(workbook, 'WH DRY', 'FB923C', 'FB923C', rows, selectedDate);
  } else {
    buildWorksheet(workbook, 'AKUMULASI STOK', 'FFD60A', 'FFD60A', rows, selectedDate);
  }

  // Export Buffer & Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanLabel = sourceLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_Akumulasi_Stok_GACOAN_${cleanLabel}_Agustus_2026.xlsx`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
