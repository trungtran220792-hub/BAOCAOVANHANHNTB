'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/data-store';
import { Users, Search, Building2, MapPin, UserCheck, UserX, Clock, Briefcase } from 'lucide-react';

export default function HRPage() {
  const { hrData, opsData, historicalData } = useData();
  const [search, setSearch] = useState('');
  const [filterStation, setFilterStation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [globalGrowthRate, setGlobalGrowthRate] = useState(10);
  const [customGrowthRates, setCustomGrowthRates] = useState<Record<string, number>>({});

  const stations = useMemo(() => [...new Set(hrData.map(h => h.station))].filter(Boolean).sort(), [hrData]);

  const filtered = useMemo(() => {
    return hrData.filter(h => {
      if (search && !h.name.toLowerCase().includes(search.toLowerCase()) && !h.id.includes(search)) return false;
      if (filterStation !== 'all' && h.station !== filterStation) return false;
      if (filterStatus !== 'all' && h.status !== filterStatus) return false;
      return true;
    });
  }, [hrData, search, filterStation, filterStatus]);

  // Station productivity config (mock)
  const [productivityTarget, setProductivityTarget] = useState(70);

  // Station summary with Scenario Planning
  const stationSummary = useMemo(() => {
    const groups = new Map<string, { total: number; active: number }>();
    hrData.forEach(h => {
      if (!groups.has(h.station)) groups.set(h.station, { total: 0, active: 0 });
      const g = groups.get(h.station)!;
      g.total++;
      if (h.status === 'Đang làm việc' || !h.endDate) g.active++;
    });

    // Helper to find matching HR station (fuzzy match)
    const findMatchingHRStation = (query: string) => {
      if (groups.has(query)) return query;
      const qLower = query.toLowerCase();
      // Remove common prefixes for better matching
      const cleanQ = qLower.replace(/^(bưu cục|bc|điểm xử lý hàng|điểm xlh|hub)\s+/i, '').trim();
      
      const match = Array.from(groups.keys()).find(k => {
        const kLower = k.toLowerCase();
        const cleanK = kLower.replace(/^(bưu cục|bc|điểm xử lý hàng|điểm xlh|hub)\s+/i, '').trim();
        return cleanK.includes(cleanQ) || cleanQ.includes(cleanK);
      });
      return match || query;
    };

    // Calculate historical volume
    const histStationData = new Map<string, { totalVol: number; months: Set<string> }>();
    historicalData.forEach(r => {
      const mappedStation = findMatchingHRStation(r.station);
      if (!histStationData.has(mappedStation)) histStationData.set(mappedStation, { totalVol: 0, months: new Set() });
      const sd = histStationData.get(mappedStation)!;
      sd.totalVol += r.volume;
      sd.months.add(r.month);
    });

    // Fallback to opsData if no historical
    const opsStationVolume = new Map<string, number>();
    opsData.forEach(r => {
      const mappedStation = findMatchingHRStation(r.station);
      opsStationVolume.set(mappedStation, (opsStationVolume.get(mappedStation) || 0) + r.volume);
    });

    // Combine all unique stations
    const allStations = new Set([
      ...Array.from(groups.keys()),
      ...Array.from(histStationData.keys()),
      ...Array.from(opsStationVolume.keys())
    ]);

    return Array.from(allStations).map(station => {
      const data = groups.get(station) || { total: 0, active: 0 };
      
      let dailyVolume2025 = 0;
      if (histStationData.has(station)) {
        const hd = histStationData.get(station)!;
        dailyVolume2025 = hd.totalVol / Math.max(1, hd.months.size * 30);
      } else {
        dailyVolume2025 = (opsStationVolume.get(station) || 0) / 30; // rough fallback
      }

      const growthRate = customGrowthRates[station] !== undefined ? customGrowthRates[station] : globalGrowthRate;
      const forecastVolume2026 = dailyVolume2025 * (1 + growthRate / 100);
      const requiredHC = Math.ceil(forecastVolume2026 / Math.max(1, productivityTarget));

      return {
        station,
        totalHC: data.total,
        activeHC: data.active,
        dailyVolume2025: Math.round(dailyVolume2025),
        growthRate,
        forecastVolume2026: Math.round(forecastVolume2026),
        requiredHC,
        gap: requiredHC - data.active,
      };
    }).sort((a, b) => b.gap - a.gap);
  }, [hrData, opsData, historicalData, productivityTarget, globalGrowthRate, customGrowthRates]);

  const handleCustomGrowthChange = (station: string, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      const newRates = { ...customGrowthRates };
      delete newRates[station];
      setCustomGrowthRates(newRates);
    } else {
      setCustomGrowthRates({ ...customGrowthRates, [station]: num });
    }
  };

  if (hrData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
          <h2 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">Chưa có dữ liệu nhân sự</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Vào <span className="text-[var(--accent-blue)] font-medium">Upload Dữ Liệu</span> để tải CSV nhân sự
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Quản Lý Nhân Sự</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">{hrData.length} nhân viên • {stations.length} bưu cục</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card emerald">
          <p className="text-xs text-[var(--text-muted)]">Đang làm việc</p>
          <p className="text-2xl font-bold text-white mt-1">{hrData.filter(h => !h.endDate || h.status === 'Đang làm việc').length}</p>
        </div>
        <div className="kpi-card rose">
          <p className="text-xs text-[var(--text-muted)]">Đã nghỉ</p>
          <p className="text-2xl font-bold text-white mt-1">{hrData.filter(h => h.endDate && h.status !== 'Đang làm việc').length}</p>
        </div>
        <div className="kpi-card blue">
          <p className="text-xs text-[var(--text-muted)]">Bưu cục</p>
          <p className="text-2xl font-bold text-white mt-1">{stations.length}</p>
        </div>
        <div className="kpi-card amber">
          <p className="text-xs text-[var(--text-muted)]">Năng suất / Tăng trưởng</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-muted)] mb-1">Mục tiêu (đơn/ngày)</span>
              <input
                type="number"
                value={productivityTarget}
                onChange={e => setProductivityTarget(Number(e.target.value) || 70)}
                className="form-input w-20 h-7 text-sm font-bold bg-[var(--bg-secondary)]"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-muted)] mb-1">Tăng trưởng chung</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={globalGrowthRate}
                  onChange={e => setGlobalGrowthRate(Number(e.target.value) || 0)}
                  className="form-input w-16 h-7 text-sm font-bold bg-[var(--bg-secondary)]"
                />
                <span className="text-xs font-bold">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staffing Calculator */}
      {(opsData.length > 0 || historicalData.length > 0) && (
        <div className="glass-card overflow-hidden border border-[var(--accent-amber)]/20">
          <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--accent-amber)]/5">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-[var(--accent-amber)]">
              <Briefcase className="w-4 h-4" />
              Bảng Điều Khiển Định Biên Tương Tác (Scenario Planner)
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Dự báo nhu cầu tuyển dụng 2026 dựa trên dữ liệu lịch sử và kịch bản tăng trưởng.
            </p>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bưu cục</th>
                  <th className="text-right">HC Hiện tại</th>
                  <th className="text-right">Volume TB/Ngày 2025</th>
                  <th className="text-center">% Tăng Trưởng</th>
                  <th className="text-right text-[var(--accent-amber)]">Dự báo Vol 2026</th>
                  <th className="text-right font-bold">HC Cần (2026)</th>
                  <th className="text-right">Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {stationSummary.filter(s => s.dailyVolume2025 > 0).map(s => (
                  <tr key={s.station} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="font-medium max-w-[200px] truncate" title={s.station}>{s.station}</td>
                    <td className="text-right font-mono">{s.activeHC}</td>
                    <td className="text-right font-mono text-[var(--text-secondary)]">{s.dailyVolume2025.toLocaleString()}</td>
                    <td className="text-center">
                      <div className="inline-flex items-center gap-1 bg-[var(--bg-secondary)] px-2 rounded border border-[var(--border-color)] focus-within:border-[var(--accent-amber)]">
                        <input 
                          type="number" 
                          className="w-12 h-6 bg-transparent text-right text-xs font-mono outline-none"
                          value={s.growthRate}
                          onChange={(e) => handleCustomGrowthChange(s.station, e.target.value)}
                        />
                        <span className="text-[10px] text-[var(--text-muted)]">%</span>
                      </div>
                    </td>
                    <td className="text-right font-mono font-medium text-[var(--accent-amber)]">{s.forecastVolume2026.toLocaleString()}</td>
                    <td className="text-right font-mono font-bold">{s.requiredHC}</td>
                    <td className="text-right">
                      <span className={`badge ${s.gap > 0 ? 'badge-danger' : s.gap < 0 ? 'badge-success' : 'badge-info'}`}>
                        {s.gap > 0 ? `+${s.gap} cần tuyển` : s.gap < 0 ? `${Math.abs(s.gap)} dư` : 'Đủ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center gap-4 flex-wrap">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--accent-blue)]" />
            Danh Sách Nhân Viên
          </h3>
          <div className="flex-1 min-w-[200px] max-w-sm">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã NV..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input w-full pl-9 text-xs h-8"
              />
            </div>
          </div>
          <select value={filterStation} onChange={e => setFilterStation(e.target.value)} className="form-select text-xs h-8">
            <option value="all">Tất cả bưu cục</option>
            {stations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Tên</th>
                <th>Chức vụ</th>
                <th>Bưu cục</th>
                <th>AM</th>
                <th>Thâm niên</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(h => (
                <tr key={h.id}>
                  <td className="font-mono text-xs text-[var(--text-muted)]">{h.id}</td>
                  <td className="font-medium">{h.name}</td>
                  <td className="text-[var(--text-secondary)]">{h.position}</td>
                  <td className="max-w-[150px] truncate" title={h.station}>{h.station}</td>
                  <td className="text-[var(--text-secondary)]">{h.am}</td>
                  <td><span className="badge badge-info">{h.seniority}</span></td>
                  <td>
                    <span className={`badge ${!h.endDate ? 'badge-success' : 'badge-danger'}`}>
                      {!h.endDate ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="px-5 py-2 bg-[var(--bg-secondary)] text-[10px] text-[var(--text-muted)]">
            Hiển thị 100/{filtered.length} nhân viên
          </div>
        )}
      </div>
    </div>
  );
}
