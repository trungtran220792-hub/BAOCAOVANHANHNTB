'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/lib/data-store';
import { LayoutDashboard, Users, Bell, LogOut, Upload, X, ChevronRight, Zap, Cloud, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'nhan-su', label: 'Nhân Sự', icon: Users },
  { id: 'canh-bao', label: 'Cảnh Báo', icon: Bell },
  { id: 'sync', label: 'Đồng Bộ Dữ Liệu', icon: Cloud },
  { id: 'upload', label: 'Upload CSV', icon: Upload },
];

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const { currentUser, logout, opsData } = useData();
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  
  const collapsed = !isPinned && !isHovered;

  useEffect(() => {
    // Check local storage for theme preference on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLightMode(true);
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
    if (!isLightMode) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <aside 
      className={`sidebar flex flex-col z-50 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`} 
      style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-[var(--border-color)]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white overflow-hidden p-[2px]"
          style={{ background: 'var(--gradient-blue)' }}>
          <img src="https://careerhub.huflit.edu.vn/wp-content/publicmedia/2024/12/Logo-GHN.jpg" alt="GHN Logo" className="w-full h-full object-contain rounded-lg" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[var(--accent-blue)] truncate">NTB Ops</h1>
            <p className="text-[10px] text-[var(--text-muted)]">Command Center</p>
          </div>
        )}
        <button 
          onClick={() => setIsPinned(!isPinned)} 
          className="ml-auto p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
          style={{ opacity: !collapsed ? 1 : 0 }}
        >
          {isPinned ? <X className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`sidebar-link w-full ${activePage === item.id ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Data info */}
      {!collapsed && opsData.length > 0 && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-[rgba(242,101,34,0.08)] border border-[rgba(242,101,34,0.2)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--accent-blue)] font-semibold mb-1">Dữ liệu</p>
          <p className="text-xs text-[var(--text-secondary)]">{opsData.length.toLocaleString()} records loaded</p>
        </div>
      )}

      {/* User */}
      <div className="p-3 border-t border-[var(--border-color)]">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {currentUser?.name?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{currentUser?.name || 'User'}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{currentUser?.role?.toUpperCase()}</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex gap-1">
              <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title={isLightMode ? "Chuyển sang chế độ Tối" : "Chuyển sang chế độ Sáng"}>
                {isLightMode ? <Moon className="w-4 h-4 text-[var(--text-muted)]" /> : <Sun className="w-4 h-4 text-[var(--text-muted)]" />}
              </button>
              <button onClick={logout} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors" title="Đăng xuất">
                <LogOut className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
