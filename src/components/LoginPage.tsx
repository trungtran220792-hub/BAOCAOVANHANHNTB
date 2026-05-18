'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-store';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useData();
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('Vui lòng nhập mã nhân viên');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      const success = login(employeeId.trim());
      if (!success) {
        setError('Mã nhân viên không hợp lệ');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      {/* BG Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-md px-6 fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--gradient-blue)', boxShadow: '0 0 40px rgba(59,130,246,0.2)' }}>
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">NTB Ops Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Hệ thống quản lý vận hành khu vực Nam Trung Bộ</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold mb-6 text-center">Đăng Nhập</h2>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                Mã Nhân Viên
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder="Nhập mã nhân viên hoặc 'admin'"
                className="form-input w-full h-11 px-4"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] text-sm text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg disabled:opacity-50"
              style={{ background: 'var(--gradient-blue)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Đăng Nhập
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border-color)]">
            <p className="text-center text-xs text-[var(--text-muted)]">
              Demo: nhập <span className="text-[var(--accent-blue)] font-medium">admin</span> để truy cập
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-8">
          © 2026 NTB Operations • GHN Express
        </p>
      </div>
    </div>
  );
}
