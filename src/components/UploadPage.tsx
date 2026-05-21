'use client';

import { useState, useCallback } from 'react';
import { useData } from '@/lib/data-store';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Database } from 'lucide-react';

export default function UploadPage() {
  const { loadOpsData, loadHrData, loadHistoricalData, opsData, hrData, historicalData, isLoading, error } = useData();
  const [dragOverOps, setDragOverOps] = useState(false);
  const [dragOverHr, setDragOverHr] = useState(false);
  const [dragOverHist, setDragOverHist] = useState(false);
  const [opsFile, setOpsFile] = useState<string | null>(null);
  const [hrFile, setHrFile] = useState<string | null>(null);
  const [histFile, setHistFile] = useState<string | null>(null);

  const handleFile = useCallback((file: File, type: 'ops' | 'hr' | 'hist') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (type === 'ops') {
        loadOpsData(text);
        setOpsFile(file.name);
      } else if (type === 'hr') {
        loadHrData(text);
        setHrFile(file.name);
      } else if (type === 'hist') {
        loadHistoricalData(text);
        setHistFile(file.name);
      }
    };
    reader.readAsText(file, 'utf-8');
  }, [loadOpsData, loadHrData, loadHistoricalData]);

  const handleDrop = useCallback((e: React.DragEvent, type: 'ops' | 'hr' | 'hist') => {
    e.preventDefault();
    if (type === 'ops') setDragOverOps(false);
    else if (type === 'hr') setDragOverHr(false);
    else if (type === 'hist') setDragOverHist(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.CSV'))) {
      handleFile(file, type);
    }
  }, [handleFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'ops' | 'hr' | 'hist') => {
    const file = e.target.files?.[0];
    if (file) handleFile(file, type);
  }, [handleFile]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Upload Dữ Liệu</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Kéo thả hoặc chọn file CSV từ Google Sheets / Looker</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span className="text-sm text-rose-300">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Operations CSV */}
        <div
          className={`glass-card p-8 text-center cursor-pointer transition-all duration-300 ${dragOverOps ? 'border-[var(--accent-blue)] bg-[rgba(59,130,246,0.05)]' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOverOps(true); }}
          onDragLeave={() => setDragOverOps(false)}
          onDrop={e => handleDrop(e, 'ops')}
          onClick={() => document.getElementById('ops-input')?.click()}
        >
          <input id="ops-input" type="file" accept=".csv" className="hidden" onChange={e => handleInput(e, 'ops')} />
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: opsData.length > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)' }}>
            {opsData.length > 0 ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            ) : (
              <FileSpreadsheet className="w-7 h-7 text-[var(--accent-blue)]" />
            )}
          </div>
          <h3 className="font-semibold text-sm mb-1">📊 Dữ Liệu Vận Hành</h3>
          <p className="text-xs text-[var(--text-muted)] mb-3">Báo cáo xử lý thành công trong ngày</p>
          {opsData.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-emerald-400 font-medium">✓ {opsFile}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{opsData.length.toLocaleString()} records loaded</p>
            </div>
          ) : (
            <p className="text-xs text-[var(--accent-blue)]">Kéo thả CSV hoặc click để chọn</p>
          )}
        </div>

        {/* HR CSV */}
        <div
          className={`glass-card p-8 text-center cursor-pointer transition-all duration-300 ${dragOverHr ? 'border-[var(--accent-cyan)] bg-[rgba(6,182,212,0.05)]' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOverHr(true); }}
          onDragLeave={() => setDragOverHr(false)}
          onDrop={e => handleDrop(e, 'hr')}
          onClick={() => document.getElementById('hr-input')?.click()}
        >
          <input id="hr-input" type="file" accept=".csv" className="hidden" onChange={e => handleInput(e, 'hr')} />
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: hrData.length > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(6,182,212,0.1)' }}>
            {hrData.length > 0 ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            ) : (
              <Database className="w-7 h-7 text-[var(--accent-cyan)]" />
            )}
          </div>
          <h3 className="font-semibold text-sm mb-1">👥 Dữ Liệu Nhân Sự</h3>
          <p className="text-xs text-[var(--text-muted)] mb-3">Tổng quan nhân sự vùng NTB</p>
          {hrData.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-emerald-400 font-medium">✓ {hrFile}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{hrData.length.toLocaleString()} records loaded</p>
            </div>
          ) : (
            <p className="text-xs text-[var(--accent-cyan)]">Kéo thả CSV hoặc click để chọn</p>
          )}
        </div>

        {/* Historical CSV */}
        <div
          className={`glass-card p-8 text-center cursor-pointer transition-all duration-300 ${dragOverHist ? 'border-[var(--accent-amber)] bg-[rgba(245,158,11,0.05)]' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOverHist(true); }}
          onDragLeave={() => setDragOverHist(false)}
          onDrop={e => handleDrop(e, 'hist')}
          onClick={() => document.getElementById('hist-input')?.click()}
        >
          <input id="hist-input" type="file" accept=".csv" className="hidden" onChange={e => handleInput(e, 'hist')} />
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: historicalData.length > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>
            {historicalData.length > 0 ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            ) : (
              <FileSpreadsheet className="w-7 h-7 text-[var(--accent-amber)]" />
            )}
          </div>
          <h3 className="font-semibold text-sm mb-1">📅 Dữ Liệu Lịch Sử</h3>
          <p className="text-xs text-[var(--text-muted)] mb-3">Dữ liệu sản lượng tháng năm cũ</p>
          {historicalData.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-emerald-400 font-medium">✓ {histFile}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{historicalData.length.toLocaleString()} records loaded</p>
            </div>
          ) : (
            <p className="text-xs text-[var(--accent-amber)]">Kéo thả CSV hoặc click để chọn</p>
          )}
        </div>
      </div>

      {/* Data Preview */}
      {opsData.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-semibold">Xem trước dữ liệu vận hành</h3>
          </div>
          <div className="overflow-x-auto max-h-[300px]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>AM</th>
                  <th>Bưu cục</th>
                  <th>Loại hàng</th>
                  <th>Ngày</th>
                  <th className="text-right">Volume</th>
                  <th className="text-right">% GTC</th>
                  <th className="text-right">% Gán</th>
                  <th className="text-right">Leadtime</th>
                </tr>
              </thead>
              <tbody>
                {opsData.slice(0, 20).map((r, i) => (
                  <tr key={i}>
                    <td className="text-[var(--text-secondary)]">{r.manager}</td>
                    <td className="font-medium max-w-[180px] truncate" title={r.station}>{r.station}</td>
                    <td><span className="badge badge-info">{r.cargoType}</span></td>
                    <td className="text-xs text-[var(--text-muted)]">{r.date}</td>
                    <td className="text-right font-mono">{r.volume.toLocaleString('vi-VN')}</td>
                    <td className="text-right">{isFinite(r.gtcRate) ? (r.gtcRate * 100).toFixed(1) : '0.0'}%</td>
                    <td className="text-right">{isFinite(r.assignRate) ? (r.assignRate * 100).toFixed(1) : '0.0'}%</td>
                    <td className="text-right text-[var(--text-secondary)]">{isFinite(r.leadtime) ? r.leadtime.toFixed(1) : '0.0'}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2 bg-[var(--bg-secondary)] text-[10px] text-[var(--text-muted)]">
            Hiển thị 20/{opsData.length.toLocaleString()} dòng đầu tiên
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)]/30 border-t-[var(--accent-blue)] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--text-muted)] mt-3">Đang xử lý dữ liệu...</p>
        </div>
      )}
    </div>
  );
}
