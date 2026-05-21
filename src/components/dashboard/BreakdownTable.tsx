'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Building2, User, MapPin } from 'lucide-react';
import type { AggregatedData } from '@/types';

interface BreakdownTableProps {
  data: AggregatedData[];
  title: string;
  icon: 'station' | 'manager' | 'province';
}

type SortKey = 'label' | 'volume' | 'avgGtcRate' | 'avgAssignRate' | 'avgLeadtime';

export default function BreakdownTable({ data, title, icon }: BreakdownTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('volume');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState(true);

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortKey] as number | string;
    const bVal = b[sortKey] as number | string;
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[var(--accent-blue)]" /> : <ChevronDown className="w-3 h-3 text-[var(--accent-blue)]" />;
  };

  const IconEl = icon === 'station' ? Building2 : icon === 'manager' ? User : MapPin;

  return (
    <div className="glass-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[rgba(242,101,34,0.03)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <IconEl className="w-4 h-4 text-[var(--accent-blue)]" />
          {title}
          <span className="text-xs text-[var(--text-muted)] font-normal ml-1">({data.length})</span>
        </h3>
        {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
      </button>

      {expanded && (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="cursor-pointer select-none" onClick={() => toggleSort('label')}>
                  <span className="flex items-center gap-1">Tên <SortIcon col="label" /></span>
                </th>
                <th className="cursor-pointer select-none text-right" onClick={() => toggleSort('volume')}>
                  <span className="flex items-center justify-end gap-1">Volume <SortIcon col="volume" /></span>
                </th>
                <th className="cursor-pointer select-none text-right" onClick={() => toggleSort('avgGtcRate')}>
                  <span className="flex items-center justify-end gap-1">% GTC <SortIcon col="avgGtcRate" /></span>
                </th>
                <th className="cursor-pointer select-none text-right" onClick={() => toggleSort('avgAssignRate')}>
                  <span className="flex items-center justify-end gap-1">% Gán <SortIcon col="avgAssignRate" /></span>
                </th>
                <th className="cursor-pointer select-none text-right" onClick={() => toggleSort('avgLeadtime')}>
                  <span className="flex items-center justify-end gap-1">Leadtime <SortIcon col="avgLeadtime" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(row => {
                const gtcPct = row.avgGtcRate * 100;
                const gtcBadge = gtcPct >= 80 ? 'badge-success' : gtcPct >= 60 ? 'badge-warning' : 'badge-danger';
                return (
                  <tr key={row.label}>
                    <td className="font-medium max-w-[220px] truncate" title={row.label}>{row.label}</td>
                    <td className="text-right font-mono">{row.volume.toLocaleString('vi-VN')}</td>
                    <td className="text-right">
                      <span className={`badge ${gtcBadge}`}>{gtcPct.toFixed(1)}%</span>
                    </td>
                    <td className="text-right font-mono">{(row.avgAssignRate * 100).toFixed(1)}%</td>
                    <td className="text-right font-mono text-[var(--text-secondary)]">{row.avgLeadtime.toFixed(1)}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
