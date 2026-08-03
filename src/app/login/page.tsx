'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 600)); // smooth UX delay

    const ok = login(username, password);
    if (ok) {
      router.push('/');
    } else {
      setError('Username atau password salah. Coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left panel — branding */}
      <div className={styles.leftPanel}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>📦</div>
          <h1>WH Cycle Count</h1>
          <p>Inventory Intelligence Dashboard<br />untuk GACOAN Padalarang</p>
        </div>
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>⚡</span>
            <span>Real-time sync dari Google Sheets</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🧊</span>
            <span>WH Fresh & WH Dry terintegrasi</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🔍</span>
            <span>Filter & sorting data instan</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>📅</span>
            <span>Navigasi per tanggal Agustus 2026</span>
          </div>
        </div>
      </div>

      {/* Right panel — login card */}
      <div className={styles.rightPanel}>
        <div className={styles.card}>
          {/* Card header */}
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>🔐</div>
            <h2>Admin Login</h2>
            <p>Masuk sebagai admin untuk mengatur konfigurasi sistem</p>
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="username">Username</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>👤</span>
                <input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🔑</span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorMsg}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                'Masuk sebagai Admin →'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span>atau</span>
          </div>

          {/* Guest access */}
          <button
            className={styles.guestBtn}
            onClick={() => router.push('/')}
          >
            Lanjut sebagai Viewer (tanpa login)
          </button>

          <p className={styles.hint}>
            Viewer hanya dapat melihat data — tidak bisa mengubah konfigurasi.
          </p>
        </div>

        <p className={styles.footer}>
          © 2026 WH Padalarang · Cycle Count Dashboard
        </p>
      </div>
    </div>
  );
}
