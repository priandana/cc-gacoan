'use client';

import { useState, useMemo } from 'react';
import styles from './SummaryTable.module.css';
import { CycleItem, SheetConfig, SourceFilter } from '@/lib/types';
import { formatExpDate } from '@/lib/utils';
import { fetchCycleData } from '@/lib/sheetsApi';
import { exportMatrixToExcel } from '@/lib/exportExcel';

interface Props {
  initialItems: CycleItem[];
  allDateDataMap?: Record<number, CycleItem[]>;
  config: SheetConfig;
  selectedDate: number;
  sourceFilter: SourceFilter;
  onSetSource?: (s: SourceFilter) => void;
}

interface SkuSummaryRow {
  sku: string;
  desc: string;
  expTerdekat: string;
  qtyByDate: Record<number, number>;
  totalQty: number;
  source: string;
}

export default function SummaryTable({
  initialItems,
  allDateDataMap = {},
  config,
  selectedDate,
  sourceFilter,
  onSetSource,
}: Props) {
  const [search, setSearch] = useState('');
  const [manualSyncedData, setManualSyncedData] = useState<Record<number, CycleItem[]>>({});
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  const handleSyncAllDates = async () => {
    if (!config.apiKey || isSyncingAll) return;
    setIsSyncingAll(true);
    setSyncedCount(0);

    const accumulated: Record<number, CycleItem[]> = { ...allDateDataMap, ...manualSyncedData };
    accumulated[selectedDate] = initialItems;

    for (let d = 1; d <= 31; d++) {
      try {
        const items = await fetchCycleData(d, config);
        if (items.length > 0) {
          accumulated[d] = items;
          setManualSyncedData({ ...accumulated });
        }
      } catch (e) {
        console.warn(`[SummaryTable] Date ${d} manual sync notice:`, e);
      }
      setSyncedCount(d);
      await new Promise(r => setTimeout(r, 150));
    }
    setIsSyncingAll(false);
  };

  const summaryRows = useMemo(() => {
    const map = new Map<string, SkuSummaryRow>();
    const combinedMap: Record<number, CycleItem[]> = {
      ...allDateDataMap,
      ...manualSyncedData,
      [selectedDate]: initialItems.length > 0 ? initialItems : (allDateDataMap[selectedDate] || []),
    };

    for (const [dateStr, items] of Object.entries(combinedMap)) {
      const dateNum = parseInt(dateStr, 10);
      if (!items || items.length === 0) continue;

      for (const item of items) {
        if (sourceFilter !== 'all' && item.source !== sourceFilter) continue;
        const key = item.sku || item.desc;
        if (!key) continue;

        if (!map.has(key)) {
          map.set(key, {
            sku: item.sku || '—',
            desc: item.desc || '—',
            expTerdekat: item.expDate || '—',
            qtyByDate: {},
            totalQty: 0,
            source: item.source,
          });
        }

        const row = map.get(key)!;
        if (item.desc && (row.desc === '—' || !row.desc)) row.desc = item.desc;
        row.qtyByDate[dateNum] = (row.qtyByDate[dateNum] || 0) + item.qty;
        row.totalQty += item.qty;
        if (item.expDate && item.expDate !== '—' && row.expTerdekat === '—') {
          row.expTerdekat = item.expDate;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.sku.localeCompare(b.sku));
  }, [initialItems, allDateDataMap, manualSyncedData, selectedDate, sourceFilter]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return summaryRows;
    const q = search.toLowerCase();
    return summaryRows.filter(
      r =>
        r.sku.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.expTerdekat.toLowerCase().includes(q)
    );
  }, [summaryRows, search]);

  const sourceBadgeLabel =
    sourceFilter === 'all'
      ? 'SEMUA GUDANG (FRESH & DRY)'
      : sourceFilter === 'fresh'
      ? 'WH FRESH'
      : 'WH DRY';

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportMatrixToExcel(filteredRows, sourceBadgeLabel, selectedDate);
    } catch (e) {
      console.error('[SummaryTable] Export error:', e);
      alert('Gagal mendownload Excel. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const activeConnectedDaysCount = useMemo(() => {
    const combinedMap: Record<number, CycleItem[]> = {
      ...allDateDataMap,
      ...manualSyncedData,
      [selectedDate]: initialItems,
    };
    return Object.keys(combinedMap).filter(d => (combinedMap[parseInt(d, 10)] || []).length > 0).length;
  }, [allDateDataMap, manualSyncedData, selectedDate, initialItems]);

  return (
    <div className={styles.wrapper}>

      {/* ── HEADER BAR ── */}
      <div className={styles.headerBar}>
        {/* Title */}
        <div className={styles.titleGroup}>
          <span className={styles.icon}>📊</span>
          <div>
            <h2 className={styles.title}>Akumulasi SKU &amp; Expired — {sourceBadgeLabel}</h2>
            <p className={styles.subText}>
              Matriks stok harian · 1–31 Agustus 2026 · <strong>{filteredRows.length}</strong> SKU ditampilkan
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionsRow}>

          {/* Button group: Export + Sync */}
          <div className={styles.btnGroup}>
            <button
              className={`${styles.exportBtn} ${isExporting ? styles.exporting : ''}`}
              onClick={handleExportExcel}
              disabled={isExporting || filteredRows.length === 0}
              title="Download Laporan Excel"
            >
              <span className={styles.exportIcon}>📊</span>
              <span>{isExporting ? 'Mengexport...' : 'Export Excel'}</span>
            </button>

            <button
              className={styles.syncBtn}
              onClick={handleSyncAllDates}
              disabled={isSyncingAll}
              title="Refresh semua tanggal 1-31"
            >
              {isSyncingAll
                ? <span>⏳ {syncedCount}/31</span>
                : <span>🔄 Refresh (1–31)</span>
              }
            </button>
          </div>

          {/* Source toggle */}
          {onSetSource && (
            <div className={styles.sourceToggle}>
              <button
                className={`${styles.toggleBtn} ${sourceFilter === 'all' ? styles.toggleActive : ''}`}
                onClick={() => onSetSource('all')}
              >ALL</button>
              <button
                className={`${styles.toggleBtn} ${sourceFilter === 'fresh' ? styles.toggleActiveFresh : ''}`}
                onClick={() => onSetSource('fresh')}
              >🧊 FRESH</button>
              <button
                className={`${styles.toggleBtn} ${sourceFilter === 'dry' ? styles.toggleActiveDry : ''}`}
                onClick={() => onSetSource('dry')}
              >📦 DRY</button>
            </div>
          )}

          {/* Search */}
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Cari SKU / Produk / Exp Date..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE SCROLL HINT ── */}
      <div className={styles.scrollHint}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        Geser tabel untuk melihat semua tanggal
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>

      {/* ── MATRIX TABLE ── */}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.stickyColSku} ${styles.thHead}`}>SKU</th>
              <th className={`${styles.stickyColDesc} ${styles.thHead}`}>DESKRIPSI</th>
              <th className={`${styles.colExpHeader} ${styles.thHead}`}>EXP</th>
              {days.map(d => (
                <th
                  key={d}
                  className={`${styles.thHead} ${styles.colDayHeader} ${d === selectedDate ? styles.currentDayHeader : ''}`}
                >
                  <span className={styles.dayNum}>{d}</span>
                  <span className={styles.dayLabel}> AGS</span>
                </th>
              ))}
              <th className={`${styles.thHead} ${styles.colTotalHeader}`}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={35} className={styles.emptyCell}>
                  <div className={styles.emptyInner}>
                    <span>🔍</span>
                    <strong>Tidak ada data</strong>
                    <span>Tidak ada akumulasi SKU untuk filter <em>{sourceBadgeLabel}</em></span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => {
                const expInfo = formatExpDate(row.expTerdekat);
                return (
                  <tr key={`${row.sku}-${idx}`} className={styles.dataRow}>
                    <td className={styles.stickyColSku}>
                      <span className={styles.skuBadge}>{row.sku}</span>
                    </td>
                    <td className={styles.stickyColDesc}>
                      <span className={styles.descText}>{row.desc}</span>
                    </td>
                    <td className={styles.colExp}>
                      <span
                        className={
                          expInfo.isExpired
                            ? styles.expRed
                            : expInfo.isWarning
                            ? styles.expOrange
                            : styles.expNormal
                        }
                      >
                        {expInfo.display || row.expTerdekat}
                      </span>
                    </td>
                    {days.map(d => {
                      const qty = row.qtyByDate[d] || 0;
                      return (
                        <td
                          key={d}
                          className={`${styles.colDayVal} ${d === selectedDate ? styles.currentDayCell : ''}`}
                        >
                          {qty > 0 ? (
                            <span className={styles.qtyPos}>{qty.toLocaleString('id-ID')}</span>
                          ) : (
                            <span className={styles.qtyZero}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className={styles.colTotalVal}>
                      <span className={styles.totalBadge}>{row.totalQty.toLocaleString('id-ID')}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ── */}
      <div className={styles.footerBar}>
        <span>
          Menampilkan <strong>{filteredRows.length} SKU</strong>
          {search && ` · pencarian "${search}"`}
        </span>
        <span className={styles.footerRight}>
          {activeConnectedDaysCount} hari stok terhubung · 1–31 Agustus 2026
        </span>
      </div>

    </div>
  );
}
