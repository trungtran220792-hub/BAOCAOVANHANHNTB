'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/data-store';
import { filterRecords, calculateKPI, generateTimeSeries, rankStations, aggregateByGroup, getUniqueValues, getProvince } from '@/lib/data-utils';
import KPICards from './dashboard/KPICards';
import TrendChart from './dashboard/TrendChart';
import TopStations from './dashboard/TopStations';
import BreakdownTable from './dashboard/BreakdownTable';
import Filters from './dashboard/Filters';
import { RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { opsData } = useData();

  // Filter state
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [manager, setManager] = useState('all');
  const [station, setStation] = useState('all');
  const [cargoType, setCargoType] = useState('all');

  const uniqueValues = useMemo(() => getUniqueValues(opsData), [opsData]);

  const filteredData = useMemo(() =>
    filterRecords(opsData, { dateStart, dateEnd, manager, station, cargoType }),
    [opsData, dateStart, dateEnd, manager, station, cargoType]
  );

  const kpi = useMemo(() => calculateKPI(filteredData), [filteredData]);
  const timeSeries = useMemo(() => generateTimeSeries(filteredData, granularity), [filteredData, granularity]);
  const rankings = useMemo(() => rankStations(filteredData), [filteredData]);

  const byManager = useMemo(() => aggregateByGroup(filteredData, r => r.manager), [filteredData]);
  const byStation = useMemo(() => aggregateByGroup(filteredData, r => r.station), [filteredData]);
  const byProvince = useMemo(() => aggregateByGroup(filteredData, r => getProvince(r.station)), [filteredData]);

  const resetFilters = () => {
    setDateStart('');
    setDateEnd('');
    setManager('all');
    setStation('all');
    setCargoType('all');
  };

  if (opsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
          <h2 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">Chưa có dữ liệu</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Vào mục <span className="text-[var(--accent-blue)] font-medium">Upload Dữ Liệu</span> để tải CSV vận hành
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard Vận Hành</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Khu vực NTB • {filteredData.length.toLocaleString()} records
            {manager !== 'all' && ` • ${manager}`}
            {station !== 'all' && ` • ${station}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Filters
        granularity={granularity}
        onGranularityChange={setGranularity}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateStartChange={setDateStart}
        onDateEndChange={setDateEnd}
        manager={manager}
        onManagerChange={setManager}
        station={station}
        onStationChange={setStation}
        cargoType={cargoType}
        onCargoTypeChange={setCargoType}
        managers={uniqueValues.managers}
        stations={uniqueValues.stations}
        cargoTypes={uniqueValues.cargoTypes}
        onReset={resetFilters}
      />

      {/* KPI Cards */}
      <KPICards kpi={kpi} />

      {/* Charts */}
      <TrendChart data={timeSeries} granularity={granularity} />

      {/* TOP 15 */}
      <TopStations stations={rankings} />

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreakdownTable data={byManager} title="Theo AM" icon="manager" />
        <BreakdownTable data={byProvince} title="Theo Tỉnh" icon="province" />
      </div>
      <BreakdownTable data={byStation} title="Theo Bưu Cục" icon="station" />
    </div>
  );
}
