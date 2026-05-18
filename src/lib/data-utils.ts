import Papa from 'papaparse';
import { parse, startOfWeek, format, isValid } from 'date-fns';
import type { OperationsRecord, WorkforceRecord, CargoType, AggregatedData, TimeSeriesPoint, StationRanking, KPISummary } from '@/types';

// Strip BOM and normalize CSV text
function cleanCSV(text: string): string {
  // Remove BOM (UTF-8, UTF-16 LE, UTF-16 BE)
  let clean = text.replace(/^\uFEFF/, '').replace(/^\uFFFE/, '');
  // Also strip any zero-width chars at start
  clean = clean.replace(/^[\u200B-\u200D\u2060]+/, '');
  return clean;
}

// Parse date string like "2026-05-11 - Thứ 2" → Date object
export function parseTimeString(timeStr: string): Date {
  if (!timeStr) return new Date();
  const datePart = timeStr.split(' - ')[0].trim();
  const parsed = parse(datePart, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : new Date();
}

// Parse number, handles commas and quotes
function parseNum(val: string | undefined | null): number {
  if (!val) return 0;
  const s = String(val).replace(/,/g, '').replace(/"/g, '').trim();
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function parseIntSafe(val: string | undefined | null): number {
  if (!val) return 0;
  const s = String(val).replace(/,/g, '').replace(/"/g, '').trim();
  const n = parseInt(s, 10);
  return isFinite(n) ? n : 0;
}

// Column name normalization map for Vietnamese CSV headers
const COLUMN_MAP: Record<string, string[]> = {
  manager:    ['Cấp Quản Lý', 'Cap Quan Ly', 'AM', 'Manager'],
  station:    ['Chi tiết', 'Chi tiet', 'Bưu cục', 'Station'],
  cargoType:  ['Loại Hàng', 'Loai Hang', 'Cargo Type'],
  time:       ['Time', 'Thời gian', 'Ngày'],
  volume:     ['Volume', 'Sản lượng'],
  assignRate: ['% Gán', '% Gan', 'Gán', 'Assign'],
  gtcRate:    ['% GTC', 'GTC', '% Giao thành công'],
  returnRate: ['% Chuyển trả', '% Chuyen tra', 'Chuyển trả'],
  leadtime:   ['Leadtime', 'Lead time', 'Thời gian giao'],
};

// Find column value by trying multiple possible header names
function getColumn(row: Record<string, string>, field: string): string {
  const aliases = COLUMN_MAP[field] || [field];
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null) return row[alias];
  }
  // Fallback: case-insensitive and trimmed search
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const lower = alias.toLowerCase();
    for (const k of keys) {
      if (k.trim().toLowerCase() === lower) return row[k];
    }
  }
  return '';
}

// Parse operations CSV data
export function parseOperationsCSV(csvText: string): OperationsRecord[] {
  console.log('[OPS v3] Starting parse, text length:', csvText.length, 'first 50 chars:', JSON.stringify(csvText.substring(0, 50)));
  
  const cleaned = cleanCSV(csvText);
  console.log('[OPS v3] After cleanCSV, first 50 chars:', JSON.stringify(cleaned.substring(0, 50)));
  
  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.replace(/^\uFEFF/, '').trim(),
  });

  if (result.data.length > 0) {
    const row0 = result.data[0];
    const headers = Object.keys(row0);
    console.log('[OPS v3] Headers:', JSON.stringify(headers));
    console.log('[OPS v3] Row 0 raw values:', JSON.stringify(row0));
    
    // Debug: trace getColumn for each field
    const fields = ['manager', 'station', 'cargoType', 'time', 'volume', 'assignRate', 'gtcRate', 'returnRate', 'leadtime'];
    for (const f of fields) {
      const val = getColumn(row0, f);
      console.log(`[OPS v3] getColumn(row0, '${f}') = '${val}'`);
    }
    
    // Direct access check
    console.log('[OPS v3] DIRECT: row0["% GTC"] =', JSON.stringify(row0['% GTC']));
    console.log('[OPS v3] DIRECT: row0["% Gán"] =', JSON.stringify(row0['% Gán']));
    console.log('[OPS v3] DIRECT: row0["Leadtime"] =', JSON.stringify(row0['Leadtime']));
    console.log('[OPS v3] DIRECT: row0["Volume"] =', JSON.stringify(row0['Volume']));
  }

  const records: OperationsRecord[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const volume = parseIntSafe(getColumn(row, 'volume'));
    if (volume <= 0) continue;

    const gtcRaw = getColumn(row, 'gtcRate');
    const ganRaw = getColumn(row, 'assignRate');
    const returnRaw = getColumn(row, 'returnRate');
    const ltRaw = getColumn(row, 'leadtime');

    const gtcRate = parseNum(gtcRaw);
    const assignRate = parseNum(ganRaw);
    const returnRate = parseNum(returnRaw);
    const leadtime = parseNum(ltRaw);

    // Debug first 3 records
    if (i < 3) {
      console.log(`[OPS v3] Record ${i}: vol=${volume}, gtcRaw='${gtcRaw}'→${gtcRate}, ganRaw='${ganRaw}'→${assignRate}, ltRaw='${ltRaw}'→${leadtime}`);
    }

    records.push({
      manager: getColumn(row, 'manager'),
      station: getColumn(row, 'station'),
      cargoType: (getColumn(row, 'cargoType') || '') as CargoType,
      date: getColumn(row, 'time'),
      dateObj: parseTimeString(getColumn(row, 'time')),
      volume,
      assignRate: assignRate > 1.5 ? assignRate / 100 : assignRate,
      gtcRate: gtcRate > 1.5 ? gtcRate / 100 : gtcRate,
      returnRate: returnRate > 1.5 ? returnRate / 100 : returnRate,
      leadtime: Math.abs(leadtime),
    });
  }

  if (records.length > 0) {
    const sample = records[0];
    console.log('[OPS v3] FINAL Parsed', records.length, 'records. Sample:', {
      v: sample.volume, gtc: sample.gtcRate, gan: sample.assignRate, lt: sample.leadtime
    });
  }

  return records;
}

// Parse workforce CSV data
export function parseWorkforceCSV(csvText: string): WorkforceRecord[] {
  const cleaned = cleanCSV(csvText);
  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.replace(/^\uFEFF/, '').trim(),
  });

  return result.data.map((row) => ({
    id: row['ID'] || row['Mã NV'] || '',
    name: row['Tên nhân viên'] || row['Tên NV'] || '',
    position: row['Chức vụ'] || '',
    startDate: row['Ngày vào làm'] || '',
    endDate: row['Ngày nghỉ việc'] || '',
    status: row['Trạng thái'] || '',
    station: row['Bưu cục'] || '',
    zone: row['Zone'] || '',
    am: row['AM'] || '',
    contractType: row['Loại HĐ'] || '',
    province: row['Tỉnh'] || '',
    region: row['Vùng'] || '',
    seniority: row['Thâm niên'] || '',
    spTeam: (row['SP Team?'] || '') === 'true',
  })).filter(r => r.id || r.name);
}

// Get unique values for filters
export function getUniqueValues(records: OperationsRecord[]) {
  return {
    managers: [...new Set(records.map(r => r.manager))].filter(Boolean).sort(),
    stations: [...new Set(records.map(r => r.station))].filter(Boolean).sort(),
    provinces: [...new Set(records.map(r => {
      const parts = r.station.split('-');
      return parts[parts.length - 1]?.trim() || '';
    }))].filter(Boolean).sort(),
    cargoTypes: [...new Set(records.map(r => r.cargoType))].filter(Boolean).sort(),
  };
}

// Extract province from station name
export function getProvince(station: string): string {
  const parts = station.split('-');
  return parts[parts.length - 1]?.trim() || 'Khác';
}

// Group date by granularity
export function getGroupKey(date: Date, granularity: 'day' | 'week' | 'month'): string {
  switch (granularity) {
    case 'day':
      return format(date, 'yyyy-MM-dd');
    case 'week': {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      return `W${format(weekStart, 'ww')} (${format(weekStart, 'dd/MM')})`;
    }
    case 'month':
      return format(date, 'yyyy-MM');
    default:
      return format(date, 'yyyy-MM-dd');
  }
}

// Aggregate records by grouping key
export function aggregateByGroup(
  records: OperationsRecord[],
  groupFn: (r: OperationsRecord) => string
): AggregatedData[] {
  const groups = new Map<string, OperationsRecord[]>();

  for (const r of records) {
    const key = groupFn(r);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return Array.from(groups.entries()).map(([label, recs]) => {
    const vol = recs.reduce((sum, r) => sum + r.volume, 0);
    return {
      label,
      volume: vol,
      avgGtcRate: vol > 0 ? recs.reduce((sum, r) => sum + r.gtcRate * r.volume, 0) / vol : 0,
      avgAssignRate: vol > 0 ? recs.reduce((sum, r) => sum + r.assignRate * r.volume, 0) / vol : 0,
      avgReturnRate: vol > 0 ? recs.reduce((sum, r) => sum + r.returnRate * r.volume, 0) / vol : 0,
      avgLeadtime: recs.length > 0 ? recs.reduce((sum, r) => sum + r.leadtime, 0) / recs.length : 0,
      recordCount: recs.length,
    };
  });
}

// Generate time series from records
export function generateTimeSeries(
  records: OperationsRecord[],
  granularity: 'day' | 'week' | 'month'
): TimeSeriesPoint[] {
  const aggregated = aggregateByGroup(records, r => getGroupKey(r.dateObj, granularity));
  return aggregated
    .map(a => ({
      date: a.label,
      volume: a.volume,
      gtcRate: Math.round(a.avgGtcRate * 10000) / 100,
      assignRate: Math.round(a.avgAssignRate * 10000) / 100,
      returnRate: Math.round(a.avgReturnRate * 10000) / 100,
      leadtime: Math.round(a.avgLeadtime * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Calculate KPI summary
export function calculateKPI(records: OperationsRecord[], previousRecords?: OperationsRecord[]): KPISummary {
  const totalVolume = records.reduce((sum, r) => sum + r.volume, 0);
  const weightedGtc = records.reduce((sum, r) => sum + r.gtcRate * r.volume, 0);
  const weightedAssign = records.reduce((sum, r) => sum + r.assignRate * r.volume, 0);
  const weightedReturn = records.reduce((sum, r) => sum + r.returnRate * r.volume, 0);
  const totalLeadtime = records.reduce((sum, r) => sum + r.leadtime, 0);

  const prevVolume = previousRecords?.reduce((sum, r) => sum + r.volume, 0) || 0;
  const prevWeightedGtc = previousRecords?.reduce((sum, r) => sum + r.gtcRate * r.volume, 0) || 0;
  const prevTotalVolume = prevVolume || 1;

  const avgGtc = totalVolume > 0 ? weightedGtc / totalVolume : 0;
  const avgAssign = totalVolume > 0 ? weightedAssign / totalVolume : 0;
  const avgReturn = totalVolume > 0 ? weightedReturn / totalVolume : 0;
  const avgLT = records.length > 0 ? totalLeadtime / records.length : 0;

  console.log('[KPI]', { totalVolume, avgGtc: avgGtc.toFixed(4), avgAssign: avgAssign.toFixed(4), avgLT: avgLT.toFixed(1) });

  return {
    totalVolume,
    avgGtcRate: avgGtc,
    avgAssignRate: avgAssign,
    avgLeadtime: avgLT,
    avgReturnRate: avgReturn,
    totalStations: new Set(records.map(r => r.station)).size,
    totalAMs: new Set(records.map(r => r.manager)).size,
    volumeTrend: prevVolume > 0 ? ((totalVolume - prevVolume) / prevVolume) * 100 : 0,
    gtcTrend: prevVolume > 0
      ? (avgGtc - (prevWeightedGtc / prevTotalVolume)) * 100
      : 0,
  };
}

// Rank stations by GTC rate
export function rankStations(records: OperationsRecord[]): StationRanking[] {
  const stationData = aggregateByGroup(records, r => r.station);

  return stationData
    .map((s) => {
      const manager = records.find(r => r.station === s.label)?.manager || '';
      return {
        station: s.label,
        manager,
        volume: s.volume,
        gtcRate: Math.round(s.avgGtcRate * 10000) / 100,
        assignRate: Math.round(s.avgAssignRate * 10000) / 100,
        returnRate: Math.round(s.avgReturnRate * 10000) / 100,
        leadtime: Math.round(s.avgLeadtime * 100) / 100,
        rank: 0,
      };
    })
    .sort((a, b) => b.gtcRate - a.gtcRate)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

// Filter operations records
export function filterRecords(
  records: OperationsRecord[],
  filters: {
    dateStart?: string;
    dateEnd?: string;
    manager?: string;
    station?: string;
    province?: string;
    cargoType?: string;
  }
): OperationsRecord[] {
  return records.filter(r => {
    if (filters.dateStart) {
      const start = new Date(filters.dateStart);
      if (r.dateObj < start) return false;
    }
    if (filters.dateEnd) {
      const end = new Date(filters.dateEnd);
      if (r.dateObj > end) return false;
    }
    if (filters.manager && filters.manager !== 'all' && r.manager !== filters.manager) return false;
    if (filters.station && filters.station !== 'all' && r.station !== filters.station) return false;
    if (filters.province && filters.province !== 'all' && !r.station.includes(filters.province)) return false;
    if (filters.cargoType && filters.cargoType !== 'all' && r.cargoType !== filters.cargoType) return false;
    return true;
  });
}

// === FORMATTING HELPERS ===

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNum(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
}

export function getTrendClass(value: number): string {
  if (value > 2) return 'text-emerald-400';
  if (value < -2) return 'text-rose-400';
  return 'text-slate-400';
}

export function getTrendIcon(value: number): string {
  if (value > 0) return '↑';
  if (value < 0) return '↓';
  return '→';
}
