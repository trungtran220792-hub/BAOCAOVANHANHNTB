'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Cloud, CloudOff, CheckCircle2, AlertCircle,
  Calendar, Lock, Eye, EyeOff, ExternalLink, Info,
  Upload, Database, Wifi, WifiOff
} from 'lucide-react';
import { useData } from '@/lib/data-store';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SyncStatus {
  hasCredentials: boolean;
  sheetUrl: string;
  sheets: string[];
}

interface SyncResult {
  success: boolean;
  scrapedRows?: number;
  writtenRows?: number;
  error?: string;
  scrapedAt?: string;
  step?: string;
  sheetUrl?: string;
}

type SyncState = 'idle' | 'running' | 'success' | 'error';

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SyncPage() {
  const { fetchDataFromBackend } = useData();
  // Status
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Ops sync form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Sync states
  const [opsSyncState, setOpsSyncState] = useState<SyncState>('idle');
  const [opsResult, setOpsResult] = useState<SyncResult | null>(null);
  const [opsSyncLog, setOpsSyncLog] = useState<string[]>([]);

  // HR upload
  const [hrSyncState, setHrSyncState] = useState<SyncState>('idle');
  const [hrResult, setHrResult] = useState<SyncResult | null>(null);
  const [hrFile, setHrFile] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Load status on mount ──────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/sync-status')
      .then(r => r.json())
      .then(d => setStatus(d))
      .catch(() => setStatus(null))
      .finally(() => setLoadingStatus(false));
  }, []);

  // ── Sync ops ──────────────────────────────────────────────────────────────

  const handleSyncOps = useCallback(async () => {
    if (!username || !password) return;

    setOpsSyncState('running');
    setOpsResult(null);
    setOpsSyncLog([]);

    const log = (msg: string) => setOpsSyncLog(prev => [...prev, `[${new Date().toLocaleTimeString('vi-VN')}] ${msg}`]);

    log('Khởi động trình duyệt...');
    log(`Đăng nhập vào baocao.ghn.vn với tài khoản: ${username}`);
    log(`Khoảng thời gian: ${dateFrom} → ${dateTo}`);

    try {
      const res = await fetch('/api/sync-ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, dateFrom, dateTo, headless: true }),
      });

      const data: SyncResult = await res.json();
      setOpsResult(data);

      if (data.success) {
        log(`✓ Scrape thành công: ${data.scrapedRows?.toLocaleString()} dòng`);
        log(`✓ Đã ghi ${data.writtenRows?.toLocaleString()} dòng vào Google Sheets`);
        log('✓ Đang đồng bộ dữ liệu về Dashboard...');
        await fetchDataFromBackend();
        log('✓ Hoàn tất!');
        setOpsSyncState('success');
      } else {
        log(`✗ Lỗi tại bước "${data.step}": ${data.error}`);
        setOpsSyncState('error');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`✗ Network error: ${msg}`);
      setOpsResult({ success: false, error: msg });
      setOpsSyncState('error');
    }
  }, [username, password, dateFrom, dateTo]);

  // ── Sync HR (file upload → sheets) ───────────────────────────────────────

  const handleHRFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.CSV')) {
      setHrResult({ success: false, error: 'Chỉ chấp nhận file .CSV' });
      setHrSyncState('error');
      return;
    }

    setHrFile(file.name);
    setHrSyncState('running');
    setHrResult(null);

    const csvText = await file.text();

    try {
      const res = await fetch('/api/sync-hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      });
      const data: SyncResult = await res.json();
      setHrResult(data);
      if (data.success) {
        await fetchDataFromBackend();
      }
      setHrSyncState(data.success ? 'success' : 'error');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setHrResult({ success: false, error: msg });
      setHrSyncState('error');
    }
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const credOk = status?.hasCredentials ?? false;
  const today = new Date().toISOString().split('T')[0];

  // Quick date presets
  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateTo(end.toISOString().split('T')[0]);
    setDateFrom(start.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Cloud className="w-5 h-5 text-[var(--accent-blue)]" />
          Đồng Bộ Dữ Liệu
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Lấy dữ liệu từ Looker Studio &amp; upload lên Google Sheets
        </p>
      </div>

      {/* Credentials Status Card */}
      <div className={`glass-card p-4 flex items-start gap-4 border ${credOk
        ? 'border-emerald-500/20 bg-emerald-500/5'
        : 'border-amber-500/20 bg-amber-500/5'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${credOk ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
          {loadingStatus ? (
            <div className="w-5 h-5 border-2 border-t-transparent border-[var(--accent-blue)] rounded-full animate-spin" />
          ) : credOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <CloudOff className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${credOk ? 'text-emerald-400' : 'text-amber-400'}`}>
            {loadingStatus ? 'Đang kiểm tra...' : credOk ? 'Google Sheets đã kết nối' : 'Chưa có credentials.json'}
          </p>
          {!loadingStatus && !credOk && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Đặt file <code className="text-amber-300 bg-amber-500/10 px-1 rounded">credentials.json</code> (Service Account) vào thư mục gốc project, sau đó restart server.
            </p>
          )}
          {!loadingStatus && credOk && status?.sheetUrl && (
            <a href={status.sheetUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-emerald-400/70 hover:text-emerald-400 flex items-center gap-1 mt-0.5 transition-colors">
              <ExternalLink className="w-3 h-3" />
              Mở Google Sheet
            </a>
          )}
        </div>
        {!loadingStatus && credOk && (
          <div className="flex gap-1">
            {(status?.sheets ?? []).map(s => (
              <span key={s} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 1: Sync Ops Data ── */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Dữ Liệu Vận Hành (Tự động)</h2>
            <p className="text-[11px] text-[var(--text-muted)]">Scrape từ baocao.ghn.vn → NangSuat_BuuCuc sheet</p>
          </div>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Playwright
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Credentials */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                <Lock className="w-3 h-3 inline mr-1" />Tài khoản GHN
              </label>
              <input
                id="ghn-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username GHN"
                className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                <Lock className="w-3 h-3 inline mr-1" />Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="ghn-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 pr-10 rounded-lg text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />Khoảng thời gian
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                max={today}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
              <span className="text-[var(--text-muted)] text-xs">→</span>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                max={today}
                onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
              {/* Quick presets */}
              <div className="flex gap-1 ml-2">
                {[7, 14, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setPreset(d)}
                    className="text-[11px] px-2 py-1 rounded-md border border-[var(--border-color)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent-blue)] transition-colors"
                  >
                    {d}N
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sync button */}
          <button
            id="btn-sync-ops"
            onClick={handleSyncOps}
            disabled={opsSyncState === 'running' || !username || !password || !credOk}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: opsSyncState === 'running'
                ? 'rgba(59,130,246,0.2)'
                : 'linear-gradient(135deg, var(--accent-blue), #6366f1)',
              color: 'white',
            }}
          >
            {opsSyncState === 'running' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang scrape dữ liệu... (có thể mất 1-3 phút)
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Bắt đầu đồng bộ dữ liệu vận hành
              </>
            )}
          </button>

          {/* Log output */}
          {opsSyncLog.length > 0 && (
            <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 max-h-44 overflow-y-auto">
              {opsSyncLog.map((line, i) => (
                <p key={i} className={`text-xs font-mono leading-5 ${
                  line.includes('✓') ? 'text-emerald-400' :
                  line.includes('✗') ? 'text-rose-400' :
                  'text-[var(--text-muted)]'
                }`}>{line}</p>
              ))}
            </div>
          )}

          {/* Result */}
          {opsResult && !opsSyncLog.length && (
            <div className={`rounded-xl p-4 flex items-start gap-3 ${
              opsResult.success
                ? 'bg-emerald-500/5 border border-emerald-500/20'
                : 'bg-rose-500/5 border border-rose-500/20'
            }`}>
              {opsResult.success
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              }
              <div>
                {opsResult.success ? (
                  <>
                    <p className="text-sm font-semibold text-emerald-400">Đồng bộ thành công!</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {opsResult.scrapedRows?.toLocaleString()} dòng scrape → {opsResult.writtenRows?.toLocaleString()} dòng ghi vào sheet
                    </p>
                    {opsResult.sheetUrl && (
                      <a href={opsResult.sheetUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3" />Mở Google Sheet
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-rose-400">Lỗi đồng bộ</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{opsResult.error}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: HR Upload → Sheets ── */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(6,182,212,0.1)] flex items-center justify-center">
            <Database className="w-4 h-4 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Dữ Liệu Nhân Sự (Thủ công)</h2>
            <p className="text-[11px] text-[var(--text-muted)]">Upload CSV → ghi vào NhanSu sheet (xóa cũ, ghi mới)</p>
          </div>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Manual
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            id="hr-drop-zone"
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-[var(--accent-cyan)] bg-[rgba(6,182,212,0.05)]'
                : 'border-[var(--border-color)] hover:border-[var(--accent-cyan)]/50'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleHRFile(file);
            }}
            onClick={() => document.getElementById('hr-file-input')?.click()}
          >
            <input
              id="hr-file-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleHRFile(f); }}
            />
            <div className="w-12 h-12 rounded-2xl bg-[rgba(6,182,212,0.1)] flex items-center justify-center mx-auto mb-3">
              {hrSyncState === 'running'
                ? <div className="w-6 h-6 border-2 border-t-transparent border-[var(--accent-cyan)] rounded-full animate-spin" />
                : hrSyncState === 'success'
                  ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  : <Upload className="w-6 h-6 text-[var(--accent-cyan)]" />
              }
            </div>
            <p className="text-sm font-medium text-white">
              {hrFile ? hrFile : 'Kéo thả hoặc click để chọn CSV nhân sự'}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Workforce Analysis CSV từ hệ thống HR
            </p>
          </div>

          {/* HR result */}
          {hrResult && (
            <div className={`rounded-xl p-4 flex items-start gap-3 ${
              hrResult.success
                ? 'bg-emerald-500/5 border border-emerald-500/20'
                : 'bg-rose-500/5 border border-rose-500/20'
            }`}>
              {hrResult.success
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              }
              <div>
                {hrResult.success ? (
                  <>
                    <p className="text-sm font-semibold text-emerald-400">Upload thành công!</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {hrResult.writtenRows?.toLocaleString()} nhân viên đã được ghi vào sheet NhanSu
                    </p>
                    {hrResult.sheetUrl && (
                      <a href={hrResult.sheetUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3" />Mở Google Sheet
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-rose-400">Lỗi upload</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{hrResult.error}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="glass-card p-4 flex items-start gap-3 border border-blue-500/10">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-muted)] space-y-1.5">
          <p><span className="text-white font-medium">Quy trình ghi dữ liệu:</span> Hệ thống sẽ <span className="text-amber-400">xóa toàn bộ dữ liệu cũ</span> trong sheet rồi ghi mới. Đảm bảo khoảng thời gian đã chọn đúng trước khi sync.</p>
          <p><span className="text-white font-medium">credentials.json:</span> Tạo Service Account tại Google Cloud Console → IAM &amp; Admin → Service Accounts → tải JSON → đặt vào thư mục gốc project và chia sẻ Editor quyền cho Service Account email vào Google Sheet.</p>
          <p><span className="text-white font-medium">Thời gian scrape:</span> Tuỳ thuộc vào lượng dữ liệu, quá trình có thể mất 1-5 phút. Giữ cửa sổ trình duyệt mở.</p>
        </div>
      </div>
    </div>
  );
}
