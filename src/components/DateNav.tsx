'use client';

import styles from './DateNav.module.css';

interface Props {
  selectedDate: number;
  todayDate: number;
  onSelect: (date: number) => void;
}

export default function DateNav({ selectedDate, todayDate, onSelect }: Props) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>TANGGAL — AGUSTUS 2026</div>
      <div className={styles.nav}>
        {days.map(day => (
          <button
            key={day}
            className={[
              styles.dateBtn,
              selectedDate === day ? styles.active : '',
              todayDate === day ? styles.today : '',
            ].join(' ')}
            onClick={() => onSelect(day)}
            aria-label={`${day} Agustus 2026`}
            aria-pressed={selectedDate === day}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
