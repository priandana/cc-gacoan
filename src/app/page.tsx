'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SheetConfig, CycleItem, DEFAULT_PERIODS } from '@/lib/types';
import { loadConfig, saveConfig, getTodayDate } from '@/lib/utils';
import { useCycleData } from '@/hooks/useCycleData';
import { isLoggedIn, logout } from '@/lib/auth';
import { fetchCycleData } from '@/lib/sheetsApi';

import Sidebar, { ActiveView } from '@/components/Sidebar';
import SettingsModal from '@/components/SettingsModal';
import StatsBar from '@/components/StatsBar';
import DateNav from '@/components/DateNav';
import DataTable from '@/components/DataTable';
import SummaryTable from '@/components/SummaryTable';
import InitialLoader from '@/components/InitialLoader';

export default function HomePage() {
  const router = useRouter();
  const today = getTodayDate();
  const [config, setConfig] = useState<SheetConfig | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('daily');

  // Initial Sync State
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [syncProgress, setSyncProgress] = useState({ current: 1, total: 31, percent: 0 });
  const [allFetchedItems, setAllFetchedItems] = useState<Record<number, CycleItem[]>>({});

  const {
    items,
    filteredItems,
    isLoading,
    error,
    selectedDate,
    sourceFilter,
    searchQuery,
    sortField,
    sortDir,
    lastUpdated,
    loadData,
    setDate,
    setSource,
    setSearch,
    setSort,
  } = useCycleData(today);

  // Auto Initial Sync on Website Open
  useEffect(() => {
    const cfg = loadConfig();
    setConfig(cfg);
    setAdminLoggedIn(isLoggedIn());

    if (!cfg.apiKey || (!cfg.freshSpreadsheetId && !cfg.drySpreadsheetId)) {
      setIsInitialSync(false);
      if (isLoggedIn()) setIsSettingsOpen(true);
      return;
    }

    let isSubscribed = true;

    async function runInitialSync() {
      const accumulated: Record<number, CycleItem[]> = {};

      // 1. Fetch Today first for instant reactivity
      try {
        const todayItems = await fetchCycleData(today, cfg);
        if (todayItems.length > 0) {
          accumulated[today] = todayItems;
        }
      } catch (e) {
        console.warn('[HomePage] Initial today fetch notice:', e);
      }

      // Load main data hook for today
      loadData(today, cfg);

      // 2. Fetch all 31 dates progressively with 150ms delay
      const total = 31;
      for (let d = 1; d <= total; d++) {
        if (!isSubscribed) break;

        if (d !== today) {
          try {
            const dateItems = await fetchCycleData(d, cfg);
            if (dateItems.length > 0) {
              accumulated[d] = dateItems;
            }
          } catch (e) {
            console.warn(`[HomePage] Initial sync date ${d} notice:`, e);
          }
        }

        if (isSubscribed) {
          setSyncProgress({
            current: d,
            total,
            percent: (d / total) * 100,
          });
          setAllFetchedItems({ ...accumulated });
        }

        // 150ms safe throttle per date
        await new Promise(r => setTimeout(r, 150));
      }

      if (isSubscribed) {
        setIsInitialSync(false);
      }
    }

    runInitialSync();

    return () => {
      isSubscribed = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ganti periode via Sidebar
  const handleSwitchPeriod = useCallback((periodId: string) => {
    if (!config) return;
    const periods = config.periods && config.periods.length > 0 ? config.periods : DEFAULT_PERIODS;
    const targetPeriod = periods.find(p => p.id === periodId);
    if (!targetPeriod) return;

    const newConfig: SheetConfig = {
      ...config,
      periods,
      activePeriodId: targetPeriod.id,
      activeMonth: targetPeriod.month,
      activeYear: targetPeriod.year,
      freshSpreadsheetId: targetPeriod.freshSpreadsheetId,
      drySpreadsheetId: targetPeriod.drySpreadsheetId,
    };

    saveConfig(newConfig);
    setConfig(newConfig);
    setAllFetchedItems({}); // Bersihkan cache data matrix periode sebelumnya

    loadData(selectedDate, newConfig);

    // Sync ulang 31 tanggal untuk periode baru
    setIsInitialSync(true);
    setSyncProgress({ current: 1, total: 31, percent: 0 });

    let isSubscribed = true;
    async function runPeriodSync() {
      const accumulated: Record<number, CycleItem[]> = {};
      const total = 31;
      for (let d = 1; d <= total; d++) {
        if (!isSubscribed) break;
        try {
          const dateItems = await fetchCycleData(d, newConfig);
          if (dateItems.length > 0) {
            accumulated[d] = dateItems;
          }
        } catch (e) {
          console.warn(`[HomePage] Period sync date ${d} notice:`, e);
        }

        if (isSubscribed) {
          setSyncProgress({
            current: d,
            total,
            percent: (d / total) * 100,
          });
          setAllFetchedItems({ ...accumulated });
        }
        await new Promise(r => setTimeout(r, 120));
      }
      if (isSubscribed) {
        setIsInitialSync(false);
      }
    }

    runPeriodSync();
  }, [config, selectedDate, loadData]);

  const handleSaveConfig = useCallback((newConfig: SheetConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
    setAllFetchedItems({});
    loadData(selectedDate, newConfig);

    // Sync ulang 31 tanggal dengan config yang baru disimpan
    setIsInitialSync(true);
    setSyncProgress({ current: 1, total: 31, percent: 0 });

    let isSubscribed = true;
    async function runReSync() {
      const accumulated: Record<number, CycleItem[]> = {};
      const total = 31;
      for (let d = 1; d <= total; d++) {
        if (!isSubscribed) break;
        try {
          const dateItems = await fetchCycleData(d, newConfig);
          if (dateItems.length > 0) {
            accumulated[d] = dateItems;
          }
        } catch (e) {
          console.warn(`[HomePage] Save sync date ${d} notice:`, e);
        }

        if (isSubscribed) {
          setSyncProgress({
            current: d,
            total,
            percent: (d / total) * 100,
          });
          setAllFetchedItems({ ...accumulated });
        }
        await new Promise(r => setTimeout(r, 120));
      }
      if (isSubscribed) {
        setIsInitialSync(false);
      }
    }

    runReSync();
  }, [selectedDate, loadData]);

  const handleDateSelect = useCallback((date: number) => {
    if (config) setDate(date, config);
  }, [config, setDate]);

  const handleRefresh = useCallback(() => {
    if (config) loadData(selectedDate, config);
  }, [config, selectedDate, loadData]);

  const handleLogout = useCallback(() => {
    logout();
    setAdminLoggedIn(false);
    setIsSettingsOpen(false);
  }, []);

  const handleLoginClick = useCallback(() => {
    router.push('/login');
  }, [router]);

  // Counts for sidebar
  const counts = {
    all: filteredItems.length,
    fresh: items.filter(i => i.source === 'fresh').length,
    dry: items.filter(i => i.source === 'dry').length,
  };

  const activeMonth = config?.activeMonth ?? 9;
  const activeYear  = config?.activeYear  ?? 2026;

  const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  return (
    <div className="app-layout">
      {/* Initial Load Progress Overlay */}
      {isInitialSync && (
        <InitialLoader
          currentDate={syncProgress.current}
          totalDates={syncProgress.total}
          percent={syncProgress.percent}
        />
      )}

      {/* Left Sidebar */}
      <Sidebar
        sourceFilter={sourceFilter}
        onSetSource={setSource}
        isAdmin={adminLoggedIn}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onLoginClick={handleLoginClick}
        itemCounts={counts}
        activeView={activeView}
        onChangeView={setActiveView}
        periods={config?.periods && config.periods.length > 0 ? config.periods : DEFAULT_PERIODS}
        activePeriodId={config?.activePeriodId || 'sep-2026'}
        onSwitchPeriod={handleSwitchPeriod}
      />

      {/* Main Content */}
      <div className="app-main">
        {/* Top Header Bar */}
        <div className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">Halo, {adminLoggedIn ? 'Admin Priandana' : 'User'} 👋</h1>
            <p className="topbar-subtitle">
              {activeView === 'summary'
                ? `Menu Akumulasi SKU & Expired — Ringkasan per Tanggal (1-31 ${monthNames[activeMonth] || 'Bulan'})`
                : `Ringkasan data Cycle Count GACOAN · Padalarang (${selectedDate} ${monthNames[activeMonth] || 'Bulan'} ${activeYear})`}
            </p>
          </div>
          <div className="topbar-right">
            <div className="live-dot">LIVE SYNC</div>
            <button
              className={`btn-icon ${isLoading ? 'spinning' : ''}`}
              onClick={handleRefresh}
              title="Refresh Data Tanggal Ini"
              disabled={isLoading}
            >
              🔄
            </button>
          </div>
        </div>

        {/* View Switch */}
        {activeView === 'summary' ? (
          <SummaryTable
            initialItems={allFetchedItems[selectedDate] || items}
            allDateDataMap={allFetchedItems}
            config={config || {
              apiKey: '',
              freshSpreadsheetId: '',
              drySpreadsheetId: '',
              freshRowStart: 6,
              dryRowStart: 7,
              freshColRange: 'A:P',
              dryColRange: 'A:P',
              activeMonth,
              activeYear,
              activePeriodId: 'sep-2026',
              periods: DEFAULT_PERIODS,
              freshColMapping: { no: 0, location: 6, sku: 7, desc: 8, expDate: 9, qty: 10, uom: 11, customer: 12 },
              dryColMapping: { no: 0, location: 5, sku: 6, desc: 7, expDate: 8, qty: 9, uom: 10, customer: 12 },
            }}
            selectedDate={selectedDate}
            sourceFilter={sourceFilter}
            onSetSource={setSource}
            activeMonth={activeMonth}
            activeYear={activeYear}
          />
        ) : (
          <>
            {/* Stat Cards */}
            <StatsBar
              items={filteredItems}
              allItems={items}
              selectedDate={selectedDate}
              lastUpdated={lastUpdated}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              activeMonth={activeMonth}
              activeYear={activeYear}
            />

            {/* Date Navigation */}
            <DateNav
              selectedDate={selectedDate}
              todayDate={today}
              onSelect={handleDateSelect}
              activeMonth={activeMonth}
              activeYear={activeYear}
            />

            {/* Data Table */}
            <DataTable
              items={filteredItems}
              selectedDate={selectedDate}
              sourceFilter={sourceFilter}
              searchQuery={searchQuery}
              sortField={sortField}
              sortDir={sortDir}
              isLoading={isLoading}
              error={error}
              onSearch={setSearch}
              onSort={setSort}
              onRetry={handleRefresh}
              activeMonth={activeMonth}
              activeYear={activeYear}
            />
          </>
        )}

      </div>

      {/* Settings Modal */}
      {config && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
}
