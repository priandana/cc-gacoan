'use client';

import styles from './SettingsModal.module.css';
import { SheetConfig, ColMapping, DEFAULT_PERIODS, Period } from '@/lib/types';
import { extractSpreadsheetId } from '@/lib/utils';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  config: SheetConfig;
  onSave: (config: SheetConfig) => void;
  onClose: () => void;
}

const COL_LABELS: Record<keyof ColMapping, string> = {
  no: 'NO',
  location: 'LOCATION',
  sku: 'SKU CODE',
  desc: 'DESC',
  expDate: 'EXP DATE',
  qty: 'QTY',
  uom: 'UOM',
  customer: 'CUSTOMER',
};

export default function SettingsModal({ isOpen, config, onSave, onClose }: Props) {
  const [form, setForm] = useState<SheetConfig>(() => ({
    ...config,
    periods: config.periods && config.periods.length > 0 ? config.periods : DEFAULT_PERIODS,
    activePeriodId: config.activePeriodId || 'sep-2026',
  }));

  const [selectedPeriodTab, setSelectedPeriodTab] = useState<string>(
    config.activePeriodId || 'sep-2026'
  );

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const periods = form.periods && form.periods.length > 0 ? form.periods : DEFAULT_PERIODS;
  const currentPeriod = periods.find(p => p.id === selectedPeriodTab) || periods[0];

  const update = (key: keyof SheetConfig, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const updatePeriodSheetId = (field: 'freshSpreadsheetId' | 'drySpreadsheetId', rawVal: string) => {
    const cleanId = extractSpreadsheetId(rawVal);
    const updatedPeriods = periods.map(p => {
      if (p.id === currentPeriod.id) {
        return { ...p, [field]: cleanId };
      }
      return p;
    });

    setForm(prev => {
      const isCurrentActive = prev.activePeriodId === currentPeriod.id;
      return {
        ...prev,
        periods: updatedPeriods,
        ...(isCurrentActive ? { [field]: cleanId } : {}),
      };
    });
    setTestResult(null);
  };

  const handleSetActivePeriod = (periodId: string) => {
    const target = periods.find(p => p.id === periodId);
    if (!target) return;
    setForm(prev => ({
      ...prev,
      activePeriodId: target.id,
      activeMonth: target.month,
      activeYear: target.year,
      freshSpreadsheetId: target.freshSpreadsheetId,
      drySpreadsheetId: target.drySpreadsheetId,
    }));
    setTestResult(null);
  };

  const updateFreshCol = (key: keyof ColMapping, value: number) => {
    setForm(prev => ({
      ...prev,
      freshColMapping: { ...prev.freshColMapping, [key]: value },
    }));
  };

  const updateDryCol = (key: keyof ColMapping, value: number) => {
    setForm(prev => ({
      ...prev,
      dryColMapping: { ...prev.dryColMapping, [key]: value },
    }));
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { getSheetTabs } = await import('@/lib/sheetsApi');
      const msgs: string[] = [];

      msgs.push(`📅 Periode: ${currentPeriod.label}`);

      if (currentPeriod.freshSpreadsheetId) {
        const tabs = await getSheetTabs(currentPeriod.freshSpreadsheetId, form.apiKey);
        msgs.push(`✅ WH Fresh: ${tabs.length} sheet (${tabs.slice(0, 5).join(', ')}...)`);
      } else {
        msgs.push(`⚠️ WH Fresh: Belum diisi`);
      }

      if (currentPeriod.drySpreadsheetId) {
        const tabs = await getSheetTabs(currentPeriod.drySpreadsheetId, form.apiKey);
        msgs.push(`✅ WH Dry: ${tabs.length} sheet (${tabs.slice(0, 5).join(', ')}...)`);
      } else {
        msgs.push(`ℹ️ WH Dry: Belum diisi (menunggu dari team)`);
      }

      setTestResult(msgs.join('\n'));
    } catch (e: unknown) {
      setTestResult(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    // Pastikan activePeriod sync dengan periods
    const activeP = periods.find(p => p.id === form.activePeriodId) || periods[0];
    const finalConfig: SheetConfig = {
      ...form,
      periods,
      activePeriodId: activeP.id,
      activeMonth: activeP.month,
      activeYear: activeP.year,
      freshSpreadsheetId: activeP.freshSpreadsheetId,
      drySpreadsheetId: activeP.drySpreadsheetId,
    };
    onSave(finalConfig);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2>⚙️ SETUP KONEKSI</h2>
            <p>Konfigurasi Google Sheets API &amp; Periode Bulanan GACOAN</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* API Key */}
          <div className={styles.section}>
            <h3>🔑 Google Sheets API Key</h3>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={form.apiKey}
              onChange={e => update('apiKey', e.target.value)}
            />
            <small>
              Buat di{' '}
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">
                Google Cloud Console
              </a>{' '}
              → Enable Sheets API → Create Credentials → API Key
            </small>
          </div>

          {/* Periode Bulanan & Spreadsheet IDs */}
          <div className={styles.section}>
            <h3>📊 Spreadsheet per Periode</h3>
            <p style={{ fontSize: '0.8rem', color: '#4B5563', marginBottom: '8px', fontWeight: 600 }}>
              Pilih tab bulan di bawah untuk mengisi Spreadsheet ID atau link masing-masing periode:
            </p>

            {/* Period Tabs */}
            <div className={styles.periodTabs}>
              {periods.map(p => {
                const isTabActive = p.id === selectedPeriodTab;
                const isDashboardActive = p.id === form.activePeriodId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.periodTab} ${isTabActive ? styles.periodTabActive : ''}`}
                    onClick={() => {
                      setSelectedPeriodTab(p.id);
                      setTestResult(null);
                    }}
                  >
                    <span>🗓 {p.label}</span>
                    {isDashboardActive && <span className={styles.activeBadge}>AKTIF</span>}
                  </button>
                );
              })}
            </div>

            {/* Inputs for Current Selected Period Tab */}
            <div className={styles.row2}>
              <div className={styles.inputGroup}>
                <label>🧊 WH FRESH — {currentPeriod.label}</label>
                <input
                  type="text"
                  placeholder="Paste URL Google Sheets atau ID..."
                  value={currentPeriod.freshSpreadsheetId}
                  onChange={e => updatePeriodSheetId('freshSpreadsheetId', e.target.value)}
                />
                <small>Bisa paste ID langsung atau full link spreadsheet</small>
              </div>
              <div className={styles.inputGroup}>
                <label>
                  📦 WH DRY — {currentPeriod.label}
                  {!currentPeriod.drySpreadsheetId && (
                    <span style={{ color: '#F59E0B', fontSize: '0.7rem', fontWeight: 700, marginLeft: '6px' }}>
                      (Menunggu team)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Paste URL Google Sheets atau ID..."
                  value={currentPeriod.drySpreadsheetId}
                  onChange={e => updatePeriodSheetId('drySpreadsheetId', e.target.value)}
                />
                <small>Bisa paste ID langsung atau full link spreadsheet</small>
              </div>
            </div>

            {/* Set as active checkbox */}
            <label className={styles.periodActiveCheckbox}>
              <input
                type="radio"
                name="activePeriodRadio"
                checked={form.activePeriodId === currentPeriod.id}
                onChange={() => handleSetActivePeriod(currentPeriod.id)}
              />
              <span>Jadikan <strong>{currentPeriod.label}</strong> sebagai periode aktif dashboard</span>
            </label>
          </div>

          {/* Row Start & Col Range */}
          <div className={styles.section}>
            <h3>📐 Range Data</h3>
            <div className={styles.row2}>
              <div className={styles.inputGroup}>
                <label>Baris mulai data — WH Fresh</label>
                <input type="number" min={1} value={form.freshRowStart}
                  onChange={e => update('freshRowStart', parseInt(e.target.value) || 6)} />
                <small>Default: 6</small>
              </div>
              <div className={styles.inputGroup}>
                <label>Baris mulai data — WH Dry</label>
                <input type="number" min={1} value={form.dryRowStart}
                  onChange={e => update('dryRowStart', parseInt(e.target.value) || 7)} />
                <small>Default: 7</small>
              </div>
              <div className={styles.inputGroup}>
                <label>Range kolom — WH Fresh</label>
                <input type="text" value={form.freshColRange}
                  onChange={e => update('freshColRange', e.target.value)} />
                <small>Default: A:P</small>
              </div>
              <div className={styles.inputGroup}>
                <label>Range kolom — WH Dry</label>
                <input type="text" value={form.dryColRange}
                  onChange={e => update('dryColRange', e.target.value)} />
                <small>Default: A:P</small>
              </div>
            </div>
          </div>

          {/* Column Mapping Fresh */}
          <div className={styles.section}>
            <div className={styles.colMappingHeader}>
              <h3>🧊 Mapping Kolom — WH FRESH</h3>
              <span className={styles.colHint}>A=0, B=1, C=2, D=3... dst.</span>
            </div>
            <p className={styles.colStructure}>
              Struktur Fresh: No | Location | SKU | Desc | Exp Date | Qty | UOM | Customer<br/>
              Index:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0 &nbsp;| 1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| 2&nbsp;&nbsp;| 3&nbsp;&nbsp;&nbsp;| 4&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| 5&nbsp;&nbsp;| 6&nbsp;&nbsp;| 7
            </p>
            <div className={styles.colGrid}>
              {(Object.keys(form.freshColMapping) as (keyof ColMapping)[]).map(key => (
                <div key={`fresh-${key}`} className={styles.inputGroup}>
                  <label>{COL_LABELS[key]}</label>
                  <input type="number" min={0} value={form.freshColMapping[key]}
                    onChange={e => updateFreshCol(key, parseInt(e.target.value) || 0)} />
                </div>
              ))}
            </div>
          </div>

          {/* Column Mapping Dry */}
          <div className={styles.section}>
            <div className={styles.colMappingHeader}>
              <h3>📦 Mapping Kolom — WH DRY</h3>
              <span className={styles.colHint}>A=0, B=1, C=2... dst.</span>
            </div>
            <p className={styles.colStructure}>
              Struktur Dry: No | Aisle | Bay | Level | Pedis | Location | SKU | Desc | ExpDate | Qty | UOM | Customer<br/>
              Index:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0 &nbsp;| 1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| 2&nbsp;&nbsp;| 3&nbsp;&nbsp;&nbsp;&nbsp;| 4&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| 5&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| 6&nbsp;&nbsp;| 7&nbsp;&nbsp;&nbsp;| 8&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| 9&nbsp;&nbsp;| 10 | 11
            </p>
            <div className={styles.colGrid}>
              {(Object.keys(form.dryColMapping) as (keyof ColMapping)[]).map(key => (
                <div key={`dry-${key}`} className={styles.inputGroup}>
                  <label>{COL_LABELS[key]}</label>
                  <input type="number" min={0} value={form.dryColMapping[key]}
                    onChange={e => updateDryCol(key, parseInt(e.target.value) || 0)} />
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className={styles.note}>
            <strong>⚠️ Penting:</strong> Pastikan spreadsheet sudah di-share ke{' '}
            <em>&quot;Anyone with the link can view&quot;</em> agar API Key bisa mengakses datanya.
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`${styles.testResult} ${testResult.includes('❌') ? styles.testError : styles.testOk}`}>
              {testResult}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.btnReset}
              onClick={() => {
                const { DEFAULT_CONFIG } = require('@/lib/types');
                setForm({
                  ...DEFAULT_CONFIG,
                  apiKey: form.apiKey,
                  periods: DEFAULT_CONFIG.periods,
                });
                setTestResult('✅ Pengaturan di-reset ke default September & Oktober');
              }}
            >
              🔄 RESET DEFAULT
            </button>
            <button className={styles.btnTest} onClick={handleTest} disabled={isTesting}>
              {isTesting ? '⏳ Testing...' : `🔌 TEST KONEKSI (${currentPeriod.label})`}
            </button>
            <button className={styles.btnSave} onClick={handleSave}>
              💾 SAVE &amp; CONNECT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
