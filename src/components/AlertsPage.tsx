'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/data-store';
import { Bell, Send, Settings, AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';
import type { Alert as AlertType } from '@/types';

export default function AlertsPage() {
  const { opsData } = useData();
  const [telegramToken, setTelegramToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Generate alerts from operations data
  const alerts = useMemo<AlertType[]>(() => {
    if (opsData.length === 0) return [];
    const alertList: AlertType[] = [];
    const now = new Date();

    // Group by station, check for concerning metrics
    const stationGroups = new Map<string, typeof opsData>();
    opsData.forEach(r => {
      if (!stationGroups.has(r.station)) stationGroups.set(r.station, []);
      stationGroups.get(r.station)!.push(r);
    });

    stationGroups.forEach((records, station) => {
      // Sort by date
      const sorted = [...records].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
      const recent = sorted.slice(0, 7);
      const previous = sorted.slice(7, 14);

      if (recent.length === 0 || previous.length === 0) return;

      // Check GTC drop
      const recentGtc = recent.reduce((s, r) => s + r.gtcRate, 0) / recent.length;
      const prevGtc = previous.reduce((s, r) => s + r.gtcRate, 0) / previous.length;
      if (prevGtc > 0 && (prevGtc - recentGtc) / prevGtc > 0.1) {
        alertList.push({
          id: `gtc-${station}`,
          type: 'volume_ca1',
          station,
          manager: records[0]?.manager || '',
          message: `GTC giảm ${((prevGtc - recentGtc) * 100).toFixed(1)}% so với tuần trước`,
          value: recentGtc * 100,
          threshold: prevGtc * 100,
          severity: (prevGtc - recentGtc) / prevGtc > 0.2 ? 'critical' : 'warning',
          createdAt: now.toISOString(),
        });
      }

      // Check volume spike
      const recentVol = recent.reduce((s, r) => s + r.volume, 0) / recent.length;
      const prevVol = previous.reduce((s, r) => s + r.volume, 0) / previous.length;
      if (prevVol > 0 && (recentVol - prevVol) / prevVol > 0.2) {
        alertList.push({
          id: `vol-${station}`,
          type: 'volume_ca1',
          station,
          manager: records[0]?.manager || '',
          message: `Volume tăng ${(((recentVol - prevVol) / prevVol) * 100).toFixed(0)}% so với tuần trước`,
          value: recentVol,
          threshold: prevVol,
          severity: (recentVol - prevVol) / prevVol > 0.5 ? 'critical' : 'warning',
          createdAt: now.toISOString(),
        });
      }

      // Check leadtime spike
      const recentLT = recent.reduce((s, r) => s + (r.leadtime || 0), 0) / recent.length;
      if (recentLT > 20) {
        alertList.push({
          id: `lt-${station}`,
          type: 'backlog',
          station,
          manager: records[0]?.manager || '',
          message: `Leadtime cao: ${recentLT.toFixed(1)}h (ngưỡng: 20h)`,
          value: recentLT,
          threshold: 20,
          severity: recentLT > 24 ? 'critical' : 'warning',
          createdAt: now.toISOString(),
        });
      }
    });

    return alertList.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return 0;
    });
  }, [opsData]);

  const sendTelegram = async () => {
    if (!telegramToken || !chatId) return;
    setSending(true);
    setSendResult(null);

    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');

    let message = `🚨 *NTB Ops Alert Report*\n`;
    message += `📅 ${new Date().toLocaleDateString('vi-VN')}\n\n`;

    if (criticalAlerts.length > 0) {
      message += `❌ *CRITICAL (${criticalAlerts.length}):*\n`;
      criticalAlerts.slice(0, 10).forEach(a => {
        message += `• ${a.station}: ${a.message}\n`;
      });
      message += '\n';
    }

    if (warningAlerts.length > 0) {
      message += `⚠️ *WARNING (${warningAlerts.length}):*\n`;
      warningAlerts.slice(0, 10).forEach(a => {
        message += `• ${a.station}: ${a.message}\n`;
      });
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
      const data = await res.json();
      setSendResult({ ok: data.ok, message: data.ok ? 'Gửi thành công!' : data.description });
    } catch (e) {
      setSendResult({ ok: false, message: 'Lỗi kết nối Telegram API' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-[var(--accent-blue)]">Cảnh Báo & Telegram</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Giám sát tự động & gửi thông báo</p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kpi-card rose">
          <p className="text-xs text-[var(--text-muted)]">Critical</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{alerts.filter(a => a.severity === 'critical').length}</p>
        </div>
        <div className="kpi-card amber">
          <p className="text-xs text-[var(--text-muted)]">Warning</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{alerts.filter(a => a.severity === 'warning').length}</p>
        </div>
        <div className="kpi-card blue">
          <p className="text-xs text-[var(--text-muted)]">Tổng cảnh báo</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{alerts.length}</p>
        </div>
      </div>

      {/* Telegram Config */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
          <Send className="w-4 h-4 text-[var(--accent-cyan)]" />
          Cấu Hình Telegram
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Bot Token</label>
            <input
              type="password"
              value={telegramToken}
              onChange={e => setTelegramToken(e.target.value)}
              placeholder="Nhập bot token..."
              className="form-input w-full text-xs h-9"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Chat ID / Group ID</label>
            <input
              type="text"
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              placeholder="Nhập chat ID..."
              className="form-input w-full text-xs h-9"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={sendTelegram}
            disabled={sending || !telegramToken || !chatId || alerts.length === 0}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'var(--gradient-blue)' }}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Gửi Cảnh Báo Qua Telegram
          </button>
          {sendResult && (
            <span className={`text-xs flex items-center gap-1 ${sendResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
              {sendResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {sendResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Alert List */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Danh Sách Cảnh Báo
          </h3>
        </div>
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400 opacity-40" />
            <p className="text-sm text-[var(--text-secondary)]">Không có cảnh báo nào</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Upload dữ liệu vận hành để bắt đầu giám sát</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)] max-h-[500px] overflow-y-auto">
            {alerts.map(alert => (
              <div key={alert.id} className="px-5 py-3 flex items-start gap-3 hover:bg-[rgba(242,101,34,0.03)] transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  alert.severity === 'critical' ? 'bg-rose-500/10' : 'bg-amber-500/10'
                }`}>
                  {alert.severity === 'critical' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.station}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{alert.message}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">AM: {alert.manager}</p>
                </div>
                <span className={`badge ${alert.severity === 'critical' ? 'badge-danger' : 'badge-warning'} flex-shrink-0`}>
                  {alert.severity === 'critical' ? 'Critical' : 'Warning'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
