import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, AlertTriangle, Clock, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { DashboardData } from '../lib/types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../components/Badge';
import { daysAgo, statusDot } from '../lib/utils';

interface Props {
  onNavigate: (page: 'reports' | 'hotspots' | 'report') => void;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, colorClass, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`card text-left hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${colorClass}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('700', '100').replace('600', '100')}`}>
          {icon}
        </div>
      </div>
    </button>
  );
}

export function Dashboard({ onNavigate }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!data) return null;

  const { stats, hotspots, recentReports } = data;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Community litter reporting overview</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reports" value={stats.total} icon={<TrendingUp className="w-6 h-6 text-gray-600" />} colorClass="text-gray-700" />
        <StatCard label="Open" value={stats.open} icon={<AlertTriangle className="w-6 h-6 text-orange-600" />} colorClass="text-orange-600" onClick={() => onNavigate('reports')} />
        <StatCard label="In Progress" value={stats.inProgress} icon={<Clock className="w-6 h-6 text-blue-600" />} colorClass="text-blue-600" onClick={() => onNavigate('reports')} />
        <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-6 h-6 text-green-600" />} colorClass="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotspots */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              🔥 Priority Hotspots
            </h3>
            <button onClick={() => onNavigate('hotspots')} className="text-sm text-brand-600 font-medium hover:underline">View all</button>
          </div>
          {hotspots.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No active hotspots</p>
          ) : (
            <div className="space-y-3">
              {hotspots.map((h, i) => (
                <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-800 truncate">{h.location}</span>
                      <span className="text-xs font-bold text-brand-700 bg-brand-100 px-1.5 py-0.5 rounded">
                        Score {h.priorityScore.total}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{h.priorityScore.breakdown}</p>
                  </div>
                  <SeverityBadge severity={h.severity} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reports */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Reports</h3>
            <button onClick={() => onNavigate('reports')} className="text-sm text-brand-600 font-medium hover:underline">View all</button>
          </div>
          {recentReports.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-gray-500 text-sm">No reports yet.</p>
              <button onClick={() => onNavigate('report')} className="btn-primary text-sm">
                Submit first report
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentReports.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot(r.status)}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-800 truncate">{r.location}</span>
                      {r.isDemo && <span className="text-xs text-gray-400">(demo)</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <CategoryBadge category={r.category} />
                      <span className="text-xs text-gray-400">{daysAgo(r.createdAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
