'use client';

import styles from './DataTable.module.css';
import { CycleItem, SortField, SortDirection, MONTHS_ID } from '@/lib/types';
import { formatExpDate, formatQty, totalQty } from '@/lib/utils';

interface Props {
  items: CycleItem[];
  isLoading: boolean;
  error: string | null;
  selectedDate: number;
  sourceFilter: string;
  searchQuery: string;
  sortField: SortField;
  sortDir: SortDirection;
  onSearch: (q: string) => void;
  onSort: (field: SortField) => void;
  onRetry: () => void;
  activeMonth: number;
  activeYear: number;
}


function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDirection }) {
  if (!active) return <span className={styles.sortIcon}>↕</span>;
  return <span className={`${styles.sortIcon} ${styles.active}`}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function DataTable({
  items,
  isLoading,
  error,
  selectedDate,
  sourceFilter,
  searchQuery,
  sortField,
  sortDir,
  onSearch,
  onSort,
  onRetry,
  activeMonth,
  activeYear,
}: Props) {
  const total = totalQty(items);
  const sourceLabel = sourceFilter === 'all' ? 'ALL' : sourceFilter === 'fresh' ? 'WH FRESH' : 'WH DRY';
  const monthName = MONTHS_ID[activeMonth] || 'Bulan';

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.titleGroup}>
          <span className={styles.dateLabel}>{selectedDate} {monthName.toUpperCase()} {activeYear}</span>
          <span className={styles.sourceTag}>{sourceLabel}</span>
          {items.length > 0 && (
            <span className={styles.countTag}>{items.length} ITEM</span>
          )}
        </div>

        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Cari item atau SKU..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            id="search-input"
          />
          {searchQuery && (
            <button className={styles.clearSearch} onClick={() => onSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className={styles.loadingState}>
          <div className={styles.bouncingLoader}>
            <div className={styles.bounceBlock} />
            <div className={styles.bounceBlock} />
            <div className={styles.bounceBlock} />
            <div className={styles.bounceBlock} />
          </div>
          <p className={styles.loadingText}>Memuat data dari Google Sheets...</p>
          <small className={styles.loadingSub}>Mengambil data {selectedDate} {monthName} {activeYear}</small>
        </div>
      )}


      {!isLoading && error && (
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>{error}</p>
          <button onClick={onRetry}>↺ COBA LAGI</button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colNo}>NO</th>
                <th
                  className={`${styles.colSku} ${styles.sortable}`}
                  onClick={() => onSort('sku')}
                >
                  SKU <SortIcon field="sku" active={sortField === 'sku'} dir={sortDir} />
                </th>
                <th
                  className={`${styles.colName} ${styles.sortable}`}
                  onClick={() => onSort('name')}
                >
                  NAMA ITEM <SortIcon field="name" active={sortField === 'name'} dir={sortDir} />
                </th>
                <th
                  className={`${styles.colExp} ${styles.sortable}`}
                  onClick={() => onSort('exp')}
                >
                  EXP DATE <SortIcon field="exp" active={sortField === 'exp'} dir={sortDir} />
                </th>
                <th
                  className={`${styles.colQty} ${styles.sortable}`}
                  onClick={() => onSort('qty')}
                >
                  QTY <SortIcon field="qty" active={sortField === 'qty'} dir={sortDir} />
                </th>
                <th className={styles.colUom}>UOM</th>
                <th className={styles.colSource}>SUMBER</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    {searchQuery
                      ? `Tidak ada hasil untuk "${searchQuery}"`
                      : 'Tidak ada data Gacoan untuk tanggal ini'}
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const expInfo = formatExpDate(item.expDate);
                  const rowClass = expInfo.isExpired
                    ? styles.rowExpired
                    : expInfo.isWarning
                    ? styles.rowWarning
                    : '';

                  return (
                    <tr 
                      key={`${item.source}-${item.sku}-${idx}`} 
                      className={rowClass}
                      style={{ animationDelay: `${Math.min(idx * 0.015, 0.3)}s` }}
                    >
                      <td className={styles.colNo}>{idx + 1}</td>
                      <td className={styles.colSku}>
                        <code className={styles.skuCode}>{item.sku || '—'}</code>
                      </td>
                      <td className={styles.colName}>
                        <span className={styles.itemName}>{item.desc}</span>
                        {item.location && (
                          <span className={styles.location}>{item.location}</span>
                        )}
                      </td>
                      <td className={styles.colExp}>
                        <span
                          className={
                            expInfo.isExpired
                              ? styles.expExpired
                              : expInfo.isWarning
                              ? styles.expWarning
                              : ''
                          }
                        >
                          {expInfo.display}
                          {expInfo.isExpired && ' ⚠️'}
                        </span>
                      </td>
                      <td className={styles.colQty}>
                        <span className={item.qty === 0 ? styles.qtyZero : styles.qtyVal}>
                          {formatQty(item.qty)}
                        </span>
                      </td>
                      <td className={styles.colUom}>{item.uom || '—'}</td>
                      <td className={styles.colSource}>
                        <span
                          className={
                            item.source === 'fresh' ? styles.badgeFresh : styles.badgeDry
                          }
                        >
                          {item.source === 'fresh' ? '🧊 FRESH' : '📦 DRY'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {!isLoading && !error && (
        <div className={styles.footer}>
          <span className={styles.rowCount}>{items.length} baris ditampilkan</span>
          <span className={styles.totalQty}>
            TOTAL QTY: <strong>{formatQty(total)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
