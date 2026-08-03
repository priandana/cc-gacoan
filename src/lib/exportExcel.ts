import ExcelJS from 'exceljs';
import { formatExpDate } from './utils';

export interface ExportRow {
  sku: string;
  desc: string;
  expTerdekat: string;
  qtyByDate: Record<number, number>;
  totalQty: number;
}

export async function exportMatrixToExcel(
  rows: ExportRow[],
  sourceLabel: string,
  selectedDate: number
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GACOAN Cycle Count Intelligence';
  workbook.created = new Date();

  const sheetName = sourceLabel.includes('FRESH')
    ? 'AKUMULASI WH FRESH'
    : sourceLabel.includes('DRY')
    ? 'AKUMULASI WH DRY'
    : 'AKUMULASI ALL GUDANG';

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 3, ySplit: 4 }],
  });

  // Theme Colors
  const headerBg = sourceLabel.includes('FRESH')
    ? '38BDF8' // Sky blue
    : sourceLabel.includes('DRY')
    ? 'FB923C' // Orange
    : 'FFD60A'; // Yellow

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
  subTitleCell.value = `Gudang: ${sourceLabel}  |  Periode: 1 - 31 Agustus 2026  |  Tanggal Pilihan: ${selectedDate} Agustus 2026  |  Di-export pada: ${nowStr}`;
  subTitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(2).height = 22;

  // Row 3: Spacing
  worksheet.getRow(3).height = 10;

  // Row 4: Table Header
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const headerValues = ['NO', 'SKU CODE', 'DESKRIPSI PRODUK', 'EXP TERDEKAT', ...days.map(d => `${d} AGS`), 'TOTAL STOK'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = headerValues;
  headerRow.height = 28;

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0A0A0A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colNumber === 36 ? 'FFFEF08A' : `FF${headerBg}` },
    };
    cell.alignment = { vertical: 'middle', horizontal: colNumber <= 3 ? 'left' : 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0A0A0A' } },
      bottom: { style: 'medium', color: { argb: 'FF0A0A0A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Data Rows (Row 5+)
  let startDataRow = 5;
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

      // Alignment & formatting
      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF94A3B8' } };
      } else if (colNumber === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      } else if (colNumber === 3) {
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
      } else if (colNumber === 36) { // Total Qty
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

  days.forEach((d, idx) => {
    const colIdx = 5 + idx;
    const colLetter = String.fromCharCode(68 + idx + 1);
    const cell = totalRow.getCell(colIdx);
    cell.value = { formula: `SUM(${colLetter}5:${colLetter}${totalRowNumber - 1})` };
    cell.numFmt = '#,##0';
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0A0A0A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
  });

  // Total overall sum
  const grandTotalCell = totalRow.getCell(36);
  grandTotalCell.value = { formula: `SUM(AJ5:AJ${totalRowNumber - 1})` };
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
    worksheet.getColumn(c).width = 11; // Date columns
  }
  worksheet.getColumn(36).width = 16; // Total Qty

  // Export Buffer & Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const fileName = `Akumulasi_Cycle_Count_${sourceLabel.replace(/[^a-zA-Z0-9]/g, '_')}_Agustus_2026.xlsx`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
