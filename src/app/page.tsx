'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-store';
import LoginPage from '@/components/LoginPage';
import Sidebar from '@/components/Sidebar';
import DashboardPage from '@/components/DashboardPage';
import HRPage from '@/components/HRPage';
import AlertsPage from '@/components/AlertsPage';
import UploadPage from '@/components/UploadPage';

export default function Home() {
  const { isAuthenticated } = useData();
  const [activePage, setActivePage] = useState('upload');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'nhan-su': return <HRPage />;
      case 'canh-bao': return <AlertsPage />;
      case 'upload': return <UploadPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: '100vh' }}>
        {renderPage()}
      </main>
    </div>
  );
}
