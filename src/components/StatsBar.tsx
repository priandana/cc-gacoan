'use client';

import styles from './StatsBar.module.css';
import { CycleItem } from '@/lib/types';
import { calculateStats } from '@/lib/utils';

interface Props {
  items: CycleItem[];
  allItems: CycleItem[];
  selectedDate: number;
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function StatsBar({
  items,
  selectedDate,
  lastUpdated,
  onRefresh,
  isLoading,
}: Props) {
  const stats = calculateStats(items);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Card 1: TOTAL ITEMS */}
        <div className={`${styles.card} ${styles.cardPurple}`}>
          <div className={styles.cardTop}>
            <div className={`${styles.iconBox} ${styles.iconPurple}`}>📦</div>
            <span className={styles.cardLabel}>TOTAL ITEMS</span>
          </div>
          <div className={styles.cardVal}>{stats.totalItems.toLocaleString('id-ID')}</div>
          <div className={styles.cardSub}>Item terdaftar di sheet</div>
        </div>

        {/* Card 2: TOTAL QTY */}
        <div className={`${styles.card} ${styles.cardCyan}`}>
          <div className={styles.cardTop}>
            <div className={`${styles.iconBox} ${styles.iconCyan}`}>📊</div>
            <span className={styles.cardLabel}>TOTAL QTY</span>
          </div>
          <div className={styles.cardVal}>{stats.totalQty.toLocaleString('id-ID')}</div>
          <div className={styles.cardSub}>Total unit fisik</div>
        </div>

        {/* Card 3: EXPIRED / WARNING */}
        <div className={`${styles.card} ${styles.cardAmber}`}>
          <div className={styles.cardTop}>
            <div className={`${styles.iconBox} ${styles.iconAmber}`}>⚠️</div>
            <span className={styles.cardLabel}>EXP / CLOSE</span>
          </div>
          <div className={styles.cardVal}>{stats.expiredCount + stats.warningCount}</div>
          <div className={styles.cardSub}>
            {stats.expiredCount > 0 ? `${stats.expiredCount} expired!` : 'Perlu perhatian'}
          </div>
        </div>

        {/* Card 4: TANGGAL AKTIF */}
        <div className={`${styles.card} ${styles.cardGreen}`}>
          <div className={styles.cardTop}>
            <div className={`${styles.iconBox} ${styles.iconGreen}`}>📅</div>
            <span className={styles.cardLabel}>TANGGAL SHEET</span>
          </div>
          <div className={styles.cardVal}>{selectedDate} Ags</div>
          <div className={styles.cardSub}>Agustus 2026</div>
        </div>
      </div>
    </div>
  );
}
