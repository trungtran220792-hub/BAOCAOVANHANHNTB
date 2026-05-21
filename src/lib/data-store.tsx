'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { OperationsRecord, WorkforceRecord, HistoricalDataRecord } from '@/types';
import { parseOperationsCSV, parseWorkforceCSV, parseHistoricalCSV } from '@/lib/data-utils';

interface DataStore {
  opsData: OperationsRecord[];
  hrData: WorkforceRecord[];
  historicalData: HistoricalDataRecord[];
  isLoading: boolean;
  error: string | null;
  loadOpsData: (csvText: string) => void;
  loadHrData: (csvText: string) => void;
  loadHistoricalData: (csvText: string) => void;
  fetchDataFromBackend: () => Promise<void>;
  isAuthenticated: boolean;
  currentUser: { id: string; name: string; role: string } | null;
  login: (employeeId: string) => boolean;
  logout: () => void;
}

const DataContext = createContext<DataStore | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [opsData, setOpsData] = useState<OperationsRecord[]>([]);
  const [hrData, setHrData] = useState<WorkforceRecord[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);

  const fetchDataFromBackend = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fetch-data');
      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch data');
      
      if (json.data.opsCSV) setOpsData(parseOperationsCSV(json.data.opsCSV));
      if (json.data.hrCSV) setHrData(parseWorkforceCSV(json.data.hrCSV));
      if (json.data.historicalCSV) setHistoricalData(parseHistoricalCSV(json.data.historicalCSV));
    } catch (e) {
      console.error('Fetch data error:', e);
      setError(e instanceof Error ? e.message : 'Lỗi lấy dữ liệu từ Google Sheets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDataFromBackend();
  }, [fetchDataFromBackend]);


  const loadOpsData = useCallback((csvText: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsed = parseOperationsCSV(csvText);
      setOpsData(parsed);
    } catch (e) {
      setError('Lỗi đọc dữ liệu vận hành');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadHrData = useCallback((csvText: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsed = parseWorkforceCSV(csvText);
      setHrData(parsed);
    } catch (e) {
      setError('Lỗi đọc dữ liệu nhân sự');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadHistoricalData = useCallback((csvText: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsed = parseHistoricalCSV(csvText);
      setHistoricalData(parsed);
    } catch (e) {
      setError('Lỗi đọc dữ liệu lịch sử');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((employeeId: string) => {
    // For demo: accept any ID, look up in hrData or use hardcoded AM list
    const amList = [
      { id: 'admin', name: 'Admin NTB', role: 'admin' },
      { id: '3087650', name: 'Thái Thị Thanh Thư', role: 'am' },
      { id: '3091629', name: 'Trần Văn Phước', role: 'am' },
    ];
    const found = amList.find(a => a.id === employeeId);
    if (found) {
      setIsAuthenticated(true);
      setCurrentUser(found);
      return true;
    }
    // Also check hrData for AM/Manager positions
    const hrUser = hrData.find(h => h.id === employeeId && (h.position.includes('Manager') || h.position.includes('Area')));
    if (hrUser) {
      setIsAuthenticated(true);
      setCurrentUser({ id: hrUser.id, name: hrUser.name, role: 'am' });
      return true;
    }
    // Demo mode: accept any ID
    setIsAuthenticated(true);
    setCurrentUser({ id: employeeId, name: `NV ${employeeId}`, role: 'am' });
    return true;
  }, [hrData]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  return (
    <DataContext.Provider value={{ 
      opsData, hrData, historicalData, isLoading, error, 
      loadOpsData, loadHrData, loadHistoricalData, fetchDataFromBackend,
      isAuthenticated, currentUser, login, logout 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}
