'use client';

import { TrendingUp, TrendingDown, Minus, Package, Target, Clock, Users } from 'lucide-react';
import type { KPISummary } from '@/types';

interface KPICardsProps {
  kpi: KPISummary;
}

// Safe format: percentage (0-1 range → display as xx.x%)
function fmtPct(val: number): string {
  if (!isFinite(val) || isNaN(val)) return '0.0%';
  const pct = Math.min(Math.max(val * 100, 0), 100);
  return `${pct.toFixed(1)}%`;
}

// Safe format: number with locale
function fmtNum(val: number): string {
  if (!isFinite(val) || isNaN(val)) return '0';
  return val.toLocaleString('vi-VN');
}

// Safe format: decimal number
function fmtDec(val: number, decimals = 1): string {
  if (!isFinite(val) || isNaN(val)) return '0.0';
  return val.toFixed(decimals);
}

export default function KPICards({ kpi }: KPICardsProps) {
  const cards = [
    {
      label: 'Tổng Volume',
      value: fmtNum(kpi.totalVolume),
      trend: kpi.volumeTrend,
      accent: 'blue',
      icon: Package,
      subLabel: `${kpi.totalStations} bưu cục`,
    },
    {
      label: '% GTC',
      value: fmtPct(kpi.avgGtcRate),
      trend: kpi.gtcTrend,
      accent: 'emerald',
      icon: Target,
      subLabel: 'Giao thành công',
    },
    {
      label: '% Gán',
      value: fmtPct(kpi.avgAssignRate),
      trend: 0,
      accent: 'amber',
      icon: Users,
      subLabel: 'Tỷ lệ gán đơn',
    },
    {
      label: 'Leadtime (h)',
      value: fmtDec(kpi.avgLeadtime),
      trend: 0,
      accent: 'rose',
      icon: Clock,
      subLabel: 'Trung bình (giờ)',
      invertTrend: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const TrendIcon = card.trend > 0 ? TrendingUp : card.trend < 0 ? TrendingDown : Minus;
        const trendPositive = card.invertTrend ? card.trend < 0 : card.trend > 0;
        const trendColor = card.trend === 0 ? 'neutral' : trendPositive ? 'up' : 'down';

        return (
          <div key={card.label} className={`kpi-card ${card.accent} fade-in fade-in-delay-${i + 1}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold mt-1 text-white">{card.value}</p>
              </div>
              <div className="p-2 rounded-xl" style={{ background: `rgba(${card.accent === 'blue' ? '59,130,246' : card.accent === 'emerald' ? '16,185,129' : card.accent === 'amber' ? '245,158,11' : '244,63,94'}, 0.1)` }}>
                <card.icon className="w-5 h-5" style={{ color: `var(--accent-${card.accent})` }} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">{card.subLabel}</span>
              {card.trend !== 0 && isFinite(card.trend) && (
                <span className={`stat-pill ${trendColor}`}>
                  <TrendIcon className="w-3 h-3" />
                  {Math.abs(card.trend).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
