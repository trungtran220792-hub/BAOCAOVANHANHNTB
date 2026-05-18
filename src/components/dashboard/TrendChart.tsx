'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ComposedChart, Line } from 'recharts';
import type { TimeSeriesPoint } from '@/types';

interface TrendChartProps {
  data: TimeSeriesPoint[];
  granularity: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3" style={{ fontSize: 12, minWidth: 160 }}>
      <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--text-secondary)]">{p.name}</span>
          </span>
          <span className="font-medium text-white">{typeof p.value === 'number' ? (p.name.includes('%') || p.name.includes('GTC') || p.name.includes('Gán') ? `${p.value.toFixed(1)}%` : p.value.toLocaleString('vi-VN')) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function TrendChart({ data, granularity }: TrendChartProps) {
  return (
    <div className="space-y-6">
      {/* Volume Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">📦 Volume theo {granularity === 'day' ? 'Ngày' : granularity === 'week' ? 'Tuần' : 'Tháng'}</h3>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="volume" name="Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI Trends */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">📈 % GTC & % Gán theo {granularity === 'day' ? 'Ngày' : granularity === 'week' ? 'Tuần' : 'Tháng'}</h3>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="gtcRate" name="% GTC" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="assignRate" name="% Gán" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="returnRate" name="% Chuyển trả" stroke="#f43f5e" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leadtime */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)]">⏱️ Leadtime trung bình (giờ)</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,49,84,0.5)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="leadtime" name="Leadtime" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
