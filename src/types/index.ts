// Operations Report Data (from daily CSV)
export interface OperationsRecord {
  manager: string;        // Cấp Quản Lý (AM)
  station: string;        // Chi tiết (Bưu cục)
  cargoType: CargoType;   // Loại Hàng
  date: string;           // Time: "2026-05-11 - Thứ 2"
  dateObj: Date;           // Parsed date
  volume: number;         // Volume
  assignRate: number;     // % Gán (0-1)
  gtcRate: number;        // % GTC (0-1)
  returnRate: number;     // % Chuyển trả (0-1)
  leadtime: number;       // Leadtime (hours)
}

export type CargoType = 'Hàng Mới Ca 1' | 'Hàng Mới Ca 2' | 'Hàng Tồn';

// Workforce Data (from HR CSV)
export interface WorkforceRecord {
  id: string;              // Mã NV
  name: string;            // Tên nhân viên
  position: string;        // Chức vụ
  startDate: string;       // Ngày vào làm
  endDate: string;         // Ngày nghỉ việc
  status: string;          // Trạng thái
  station: string;         // Bưu cục
  zone: string;            // Zone
  am: string;              // AM quản lý
  contractType: string;    // Loại HĐ
  province: string;        // Tỉnh
  region: string;          // Vùng
  seniority: string;       // Thâm niên
  spTeam: boolean;         // SP Team?
}

// Dashboard KPI
export interface KPISummary {
  totalVolume: number;
  avgGtcRate: number;
  avgAssignRate: number;
  avgLeadtime: number;
  avgReturnRate: number;
  totalStations: number;
  totalAMs: number;
  volumeTrend: number;   // % change vs previous period
  gtcTrend: number;
}

// Aggregated data by group
export interface AggregatedData {
  label: string;
  volume: number;
  avgGtcRate: number;
  avgAssignRate: number;
  avgReturnRate: number;
  avgLeadtime: number;
  recordCount: number;
}

// Time series data point for charts
export interface TimeSeriesPoint {
  date: string;
  volume: number;
  gtcRate: number;
  assignRate: number;
  returnRate: number;
  leadtime: number;
}

// Station ranking
export interface StationRanking {
  station: string;
  manager: string;
  volume: number;
  gtcRate: number;
  assignRate: number;
  returnRate: number;
  leadtime: number;
  rank: number;
}

// Productivity Config
export interface ProductivityConfig {
  station: string;
  target: number;          // đơn/ngày/NV (default 70)
  currentHeadcount: number;
  requiredHeadcount: number;
  gap: number;             // required - current
}

// Alert
export interface Alert {
  id: string;
  type: AlertType;
  station: string;
  manager: string;
  message: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  createdAt: string;
}

export type AlertType = 'volume_ca1' | 'volume_ca2' | 'backlog' | 'productivity' | 'staffing';

// Telegram Config
export interface TelegramConfig {
  botToken: string;
  groupChatIds: string[];
  personalChatIds: { name: string; chatId: string }[];
  scheduleTime: string;   // HH:mm format
  enabledAlerts: AlertType[];
}

// Filter state
export interface DashboardFilters {
  granularity: 'day' | 'week' | 'month';
  dateRange: { start: string; end: string };
  province: string;
  manager: string;
  station: string;
  cargoType: CargoType | 'all';
}

// Auth user
export interface AuthUser {
  id: string;
  name: string;
  role: 'am' | 'manager' | 'admin';
  station: string;
  zone: string;
}

// Navigation
export interface NavItem {
  label: string;
  href: string;
  icon: string;
}
