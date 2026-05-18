'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/data-store';
import { Users, Search, Building2, MapPin, UserCheck, UserX, Clock, Briefcase } from 'lucide-react';

export default function HRPage() {
  const { hrData, opsData } = useData();
  const [search, setSearch] = useState('');
  const [filterStation, setFilterStation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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

  // Station summary
  const stationSummary = useMemo(() => {
    const groups = new Map<string, { total: number; active: number }>();
    hrData.forEach(h => {
      if (!groups.has(h.station)) groups.set(h.station, { total: 0, active: 0 });
      const g = groups.get(h.station)!;
      g.total++;
      if (h.status === 'Đang làm việc' || !h.endDate) g.active++;
    });

    // Add volume data from opsData
    const stationVolume = new Map<string, number>();
    opsData.forEach(r => {
      stationVolume.set(r.station, (stationVolume.get(r.station) || 0) + r.volume);
    });

    return Array.from(groups.entries()).map(([station, data]) => {
      const dailyVolume = (stationVolume.get(station) || 0) / 30; // rough avg
      const requiredHC = Math.ceil(dailyVolume / productivityTarget);
      return {
        station,
        totalHC: data.total,
        activeHC: data.active,
        dailyVolume: Math.round(dailyVolume),
        requiredHC,
        gap: requiredHC - data.active,
      };
    }).sort((a, b) => b.gap - a.gap);
  }, [hrData, opsData, productivityTarget]);

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
          <p className="text-xs text-[var(--text-muted)]">Năng suất mục tiêu</p>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              value={productivityTarget}
              onChange={e => setProductivityTarget(Number(e.target.value) || 70)}
              className="form-input w-20 h-8 text-lg font-bold"
            />
            <span className="text-xs text-[var(--text-muted)]">đơn/NV/ngày</span>
          </div>
        </div>
      </div>

      {/* Staffing Calculator */}
      {opsData.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[var(--accent-amber)]" />
              Tính Toán Định Biên
              <span className="text-xs text-[var(--text-muted)] font-normal ml-2">Mục tiêu: {productivityTarget} đơn/NV/ngày</span>
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bưu cục</th>
                  <th className="text-right">HC Hiện tại</th>
                  <th className="text-right">Volume TB/Ngày</th>
                  <th className="text-right">HC Cần</th>
                  <th className="text-right">Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {stationSummary.filter(s => s.dailyVolume > 0).map(s => (
                  <tr key={s.station}>
                    <td className="font-medium max-w-[200px] truncate" title={s.station}>{s.station}</td>
                    <td className="text-right font-mono">{s.activeHC}</td>
                    <td className="text-right font-mono">{s.dailyVolume}</td>
                    <td className="text-right font-mono">{s.requiredHC}</td>
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
