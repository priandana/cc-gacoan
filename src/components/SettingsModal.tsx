'use client';

import styles from './SettingsModal.module.css';
import { SheetConfig, ColMapping, MONTHS_ID } from '@/lib/types';
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
  const [form, setForm] = useState<SheetConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const update = (key: keyof SheetConfig, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }));
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
      if (form.freshSpreadsheetId) {
        const tabs = await getSheetTabs(form.freshSpreadsheetId, form.apiKey);
        msgs.push(`✅ WH Fresh: ${tabs.length} sheet (${tabs.slice(0, 5).join(', ')}...)`);
      }
      if (form.drySpreadsheetId) {
        const tabs = await getSheetTabs(form.drySpreadsheetId, form.apiKey);
        msgs.push(`✅ WH Dry: ${tabs.length} sheet (${tabs.slice(0, 5).join(', ')}...)`);
      }
      setTestResult(msgs.join('\n'));
    } catch (e: unknown) {
      setTestResult(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2>⚙️ SETUP KONEKSI</h2>
            <p>Konfigurasi Google Sheets API untuk Cycle Count GACOAN</p>
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

          {/* Periode Aktif */}
          <div className={styles.section}>
            <h3>📅 Periode Data Aktif</h3>
            <div className={styles.row2}>
              <div className={styles.inputGroup}>
                <label>Bulan</label>
                <select
                  value={form.activeMonth}
                  onChange={e => update('activeMonth', parseInt(e.target.value))}
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '2px solid #0A0A0A', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  {MONTHS_ID.slice(1).map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
                <small>Bulan yang sedang aktif di spreadsheet</small>
              </div>
              <div className={styles.inputGroup}>
                <label>Tahun</label>
                <input
                  type="number"
                  min={2024}
                  max={2099}
                  value={form.activeYear}
                  onChange={e => update('activeYear', parseInt(e.target.value))}
                />
                <small>Tahun periode aktif</small>
              </div>
            </div>
          </div>

          {/* Spreadsheet IDs */}
          <div className={styles.section}>
            <h3>📊 Spreadsheet IDs</h3>
            <div className={styles.row2}>
              <div className={styles.inputGroup}>
                <label>🧊 WH FRESH — Spreadsheet ID</label>
                <input
                  type="text"
                  placeholder="1AbCdEfGhIjKlMnOpQrSt..."
                  value={form.freshSpreadsheetId}
                  onChange={e => update('freshSpreadsheetId', e.target.value)}
                />
                <small>Dari URL: /spreadsheets/d/<strong>[ID INI]</strong>/edit</small>
              </div>
              <div className={styles.inputGroup}>
                <label>📦 WH DRY — Spreadsheet ID</label>
                <input
                  type="text"
                  placeholder="1AbCdEfGhIjKlMnOpQrSt..."
                  value={form.drySpreadsheetId}
                  onChange={e => update('drySpreadsheetId', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Row Start & Col Range */}
          <div className={styles.section}>
            <h3>📐 Range Data</h3>
            <div className={styles.row2}>
              <div className={styles.inputGroup}>
                <label>Baris mulai data — WH Fresh</label>
                <input type="number" min={1} value={form.freshRowStart}
                  onChange={e => update('freshRowStart', parseInt(e.target.value))} />
                <small>Default: 6</small>
              </div>
              <div className={styles.inputGroup}>
                <label>Baris mulai data — WH Dry</label>
                <input type="number" min={1} value={form.dryRowStart}
                  onChange={e => update('dryRowStart', parseInt(e.target.value))} />
                <small>Default: 7</small>
              </div>
              <div className={styles.inputGroup}>
                <label>Range kolom — WH Fresh</label>
                <input type="text" value={form.freshColRange}
                  onChange={e => update('freshColRange', e.target.value)} />
                <small>Default: A:H</small>
              </div>
              <div className={styles.inputGroup}>
                <label>Range kolom — WH Dry</label>
                <input type="text" value={form.dryColRange}
                  onChange={e => update('dryColRange', e.target.value)} />
                <small>Default: A:L</small>
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
                    onChange={e => updateFreshCol(key, parseInt(e.target.value))} />
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
                    onChange={e => updateDryCol(key, parseInt(e.target.value))} />
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
                setForm({ ...DEFAULT_CONFIG, apiKey: form.apiKey, freshSpreadsheetId: form.freshSpreadsheetId, drySpreadsheetId: form.drySpreadsheetId });
                setTestResult('✅ Mapping kolom di-reset ke default (struktur 12 kolom)');
              }}
            >
              🔄 RESET KOLOM
            </button>
            <button className={styles.btnTest} onClick={handleTest} disabled={isTesting}>
              {isTesting ? '⏳ Testing...' : '🔌 TEST KONEKSI'}
            </button>
            <button className={styles.btnSave} onClick={handleSave}>
              💾 SAVE & CONNECT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
