'use client';

import { useState } from 'react';
import { Trophy, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import type { StationRanking } from '@/types';

interface TopStationsProps {
  stations: StationRanking[];
}

export default function TopStations({ stations }: TopStationsProps) {
  const [view, setView] = useState<'best' | 'worst'>('best');
  const top15 = view === 'best' ? stations.slice(0, 15) : stations.slice(-15).reverse();

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {view === 'best' ? (
            <><Trophy className="w-4 h-4 text-amber-400" /> TOP 15 Bưu Cục Tốt Nhất</>
          ) : (
            <><AlertTriangle className="w-4 h-4 text-rose-400" /> TOP 15 Bưu Cục Cần Cải Thiện</>
          )}
        </h3>
        <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-0.5">
          <button
            onClick={() => setView('best')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'best' ? 'bg-[var(--accent-emerald)] text-white shadow' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            <ArrowUp className="w-3 h-3 inline mr-1" />Tốt nhất
          </button>
          <button
            onClick={() => setView('worst')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'worst' ? 'bg-[var(--accent-rose)] text-white shadow' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            <ArrowDown className="w-3 h-3 inline mr-1" />Cần cải thiện
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Bưu Cục</th>
              <th>AM</th>
              <th className="text-right">Volume</th>
              <th className="text-right">% GTC</th>
              <th className="text-right">% Gán</th>
              <th className="text-right">Leadtime</th>
            </tr>
          </thead>
          <tbody>
            {top15.map((s, i) => {
              const gtcColor = s.gtcRate >= 80 ? 'text-emerald-400' : s.gtcRate >= 60 ? 'text-amber-400' : 'text-rose-400';
              const gtcBadge = s.gtcRate >= 80 ? 'badge-success' : s.gtcRate >= 60 ? 'badge-warning' : 'badge-danger';
              return (
                <tr key={s.station}>
                  <td>
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                      view === 'best' && i < 3 ? 'bg-amber-400/20 text-amber-400' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                    }`}>
                      {view === 'best' ? i + 1 : stations.length - 14 + i}
                    </span>
                  </td>
                  <td className="font-medium text-white max-w-[200px] truncate" title={s.station}>{s.station}</td>
                  <td className="text-[var(--text-secondary)]">{s.manager}</td>
                  <td className="text-right font-mono">{s.volume.toLocaleString('vi-VN')}</td>
                  <td className="text-right">
                    <span className={`badge ${gtcBadge}`}>{s.gtcRate.toFixed(1)}%</span>
                  </td>
                  <td className="text-right font-mono">{s.assignRate.toFixed(1)}%</td>
                  <td className="text-right font-mono text-[var(--text-secondary)]">{s.leadtime.toFixed(1)}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
