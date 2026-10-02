'use client';

import styles from './DateNav.module.css';
import { MONTHS_ID } from '@/lib/types';

interface Props {
  selectedDate: number;
  todayDate?: number;
  onSelect: (date: number) => void;
  activeMonth: number;
  activeYear: number;
}

export default function DateNav({ selectedDate, onSelect, activeMonth, activeYear }: Props) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const monthName = MONTHS_ID[activeMonth] || 'Bulan';

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>TANGGAL — {monthName.toUpperCase()} {activeYear}</div>
      <div className={styles.nav}>
        {days.map(day => (
          <button
            key={day}
            className={`${styles.dateBtn} ${selectedDate === day ? styles.active : ''}`}
            onClick={() => onSelect(day)}
            aria-label={`${day} ${monthName} ${activeYear}`}
            aria-pressed={selectedDate === day}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
