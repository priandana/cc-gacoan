'use client';

import styles from './InitialLoader.module.css';

interface Props {
  currentDate: number;
  totalDates: number;
  percent: number;
}

export default function InitialLoader({
  currentDate,
  totalDates,
  percent,
}: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.logoBadge}>📦</div>

        <div className={styles.titleGroup}>
          <h2>WH Cycle Count GACOAN</h2>
          <p>Singkronisasi Data Inventaris Gudang Padalarang</p>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>

        <div>
          <div className={styles.statusText}>
            Memuat Data Tgl {currentDate} dari {totalDates} ({Math.round(percent)}%)
          </div>
          <div className={styles.subStatus}>
            Mengambil sheet WH Fresh & WH Dry per tanggal secara aman...
          </div>
        </div>
      </div>
    </div>
  );
}
