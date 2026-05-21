'use client';

import { Filter, Calendar, X } from 'lucide-react';

interface FiltersProps {
  granularity: 'day' | 'week' | 'month';
  onGranularityChange: (g: 'day' | 'week' | 'month') => void;
  dateStart: string;
  dateEnd: string;
  onDateStartChange: (v: string) => void;
  onDateEndChange: (v: string) => void;
  manager: string;
  onManagerChange: (v: string) => void;
  station: string;
  onStationChange: (v: string) => void;
  cargoType: string;
  onCargoTypeChange: (v: string) => void;
  managers: string[];
  stations: string[];
  cargoTypes: string[];
  onReset: () => void;
}

export default function Filters(props: FiltersProps) {
  const hasFilters = props.manager !== 'all' || props.station !== 'all' || props.cargoType !== 'all' || props.dateStart || props.dateEnd;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" /> Bộ lọc
        </h3>
        {hasFilters && (
          <button onClick={props.onReset} className="text-xs text-[var(--accent-blue)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" /> Xóa lọc
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Granularity */}
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Kỳ</label>
          <div className="flex gap-0.5 bg-[var(--bg-secondary)] rounded-lg p-0.5">
            {(['day', 'week', 'month'] as const).map(g => (
              <button
                key={g}
                onClick={() => props.onGranularityChange(g)}
                className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  props.granularity === g
                    ? 'bg-[var(--accent-blue)] text-white shadow'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {g === 'day' ? 'Ngày' : g === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Từ ngày</label>
          <input type="date" value={props.dateStart} onChange={e => props.onDateStartChange(e.target.value)} className="form-input w-full text-xs h-8" />
        </div>
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Đến ngày</label>
          <input type="date" value={props.dateEnd} onChange={e => props.onDateEndChange(e.target.value)} className="form-input w-full text-xs h-8" />
        </div>

        {/* Manager */}
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">AM</label>
          <select value={props.manager} onChange={e => props.onManagerChange(e.target.value)} className="form-select w-full text-xs h-8">
            <option value="all">Tất cả</option>
            {props.managers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Station */}
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Bưu cục</label>
          <select value={props.station} onChange={e => props.onStationChange(e.target.value)} className="form-select w-full text-xs h-8">
            <option value="all">Tất cả</option>
            {props.stations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Cargo Type */}
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Loại hàng</label>
          <select value={props.cargoType} onChange={e => props.onCargoTypeChange(e.target.value)} className="form-select w-full text-xs h-8">
            <option value="all">Tất cả</option>
            {props.cargoTypes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
