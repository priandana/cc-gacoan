'use client';

import styles from './Sidebar.module.css';
import { SourceFilter } from '@/lib/types';
import { useState } from 'react';

export type ActiveView = 'daily' | 'summary';

interface SidebarProps {
  activeView: ActiveView;
  onChangeView: (v: ActiveView) => void;
  sourceFilter: SourceFilter;
  onSetSource: (s: SourceFilter) => void;
  isAdmin: boolean;
  onSettingsClick: () => void;
  onLogout: () => void;
  onLoginClick: () => void;
  itemCounts: {
    all: number;
    fresh: number;
    dry: number;
  };
}

export default function Sidebar({
  activeView,
  onChangeView,
  sourceFilter,
  onSetSource,
  isAdmin,
  onSettingsClick,
  onLogout,
  onLoginClick,
  itemCounts,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (fn: () => void) => {
    fn();
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className={styles.hamburger}
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {/* Overlay backdrop */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
      {/* Brand Header */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div className={styles.logoText}>
          <div className={styles.logoTitle}>Cycle Count</div>
          <div className={styles.logoSubtitle}>GACOAN Padalarang</div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className={styles.navGroup}>
        <div className={styles.groupLabel}>MENU UTAMA</div>

        {/* Daily Dashboard */}
        <button
          className={`${styles.navBtn} ${activeView === 'daily' && sourceFilter === 'all' ? styles.active : ''}`}
          onClick={() => handleNav(() => { onChangeView('daily'); onSetSource('all'); })}
        >
          <svg className={styles.navIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
          </svg>
          <span>Dashboard Harian</span>
        </button>

        {/* Akumulasi SKU Matrix */}
        <button
          className={`${styles.navBtn} ${activeView === 'summary' ? styles.active : ''}`}
          onClick={() => handleNav(() => onChangeView('summary'))}
        >
          <svg className={styles.navIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Akumulasi SKU</span>
          <span className={styles.newTag}>NEW</span>
        </button>

        <div className={styles.groupLabel}>FILTER GUDANG</div>

        {/* WH Fresh */}
        <button
          className={`${styles.navBtn} ${sourceFilter === 'fresh' ? styles.active : ''}`}
          onClick={() => handleNav(() => onSetSource('fresh'))}
        >
          <svg className={styles.navIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="2" x2="12" y2="22"></line>
            <path d="M20 16l-8 4-8-4"></path>
            <path d="M4 8l8-4 8 4"></path>
          </svg>
          <span>WH Fresh</span>
          {itemCounts.fresh > 0 && (
            <span className={`${styles.badge} ${sourceFilter === 'fresh' ? styles.activeBadge : ''}`}>
              {itemCounts.fresh}
            </span>
          )}
        </button>

        {/* WH Dry */}
        <button
          className={`${styles.navBtn} ${sourceFilter === 'dry' ? styles.active : ''}`}
          onClick={() => handleNav(() => onSetSource('dry'))}
        >
          <svg className={styles.navIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
          <span>WH Dry</span>
          {itemCounts.dry > 0 && (
            <span className={`${styles.badge} ${sourceFilter === 'dry' ? styles.activeBadge : ''}`}>
              {itemCounts.dry}
            </span>
          )}
        </button>
      </div>

      {/* Admin / Footer Links (Only rendered when logged in) */}
      {isAdmin && (
        <div className={styles.footerGroup}>
          <div className={styles.groupLabel}>ADMINISTRASI</div>
          <button className={styles.navBtn} onClick={onSettingsClick}>
            <svg className={styles.navIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Pengaturan Sheet</span>
          </button>
          <button className={styles.navBtn} onClick={onLogout}>
            <svg className={styles.navIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
          <div className={styles.adminPill}>
            <span className={styles.onlineDot} />
            <span>Admin Logged In</span>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
