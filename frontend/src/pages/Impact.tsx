import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, BarChart3, RefreshCw, Leaf, Package } from 'lucide-react';
import { api } from '../lib/api';
import { Report } from '../lib/types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';
import { CategoryBadge } from '../components/Badge';
import { formatDate } from '../lib/utils';

export function Impact() {
  const [resolvedReports, setResolvedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { reports } = await api.getReports({ status: 'resolved' });
      setResolvedReports(reports);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load impact data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Only count waste where a real quantity was entered
  const reportedWaste = resolvedReports
    .filter((r) => r.wasteCollectedKg !== undefined && r.wasteCollectedKg > 0)
    .reduce((sum, r) => sum + (r.wasteCollectedKg ?? 0), 0);

  const reportsWithWaste = resolvedReports.filter(
    (r) => r.wasteCollectedKg !== undefined && r.wasteCollectedKg > 0
  ).length;

  // Category breakdown
  const byCat = resolvedReports.reduce(
    (acc, r) => { acc[r.category] = (acc[r.category] || 0) + 1; return acc; },
    {} as Record<string, number>
  );
  const catEntries = Object.entries(byCat).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" /> Environmental Impact
          </h2>
          <p className="text-sm text-gray-500 mt-1">Verified cleanup outcomes from resolved reports</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Honesty notice */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-800">
        <p className="font-medium mb-1 flex items-center gap-1.5">
          <Leaf className="w-4 h-4" /> What we track
        </p>
        <p>We only display data that has been explicitly recorded. Waste quantities are only shown when a volunteer entered them during resolution. We do not estimate, extrapolate, or fabricate environmental outcomes.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading impact data…" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-4xl font-bold text-green-600">{resolvedReports.length}</div>
              <div className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Sites cleaned up
              </div>
            </div>
            {reportedWaste > 0 ? (
              <div className="card text-center">
                <div className="text-4xl font-bold text-brand-600">{reportedWaste.toFixed(1)}</div>
                <div className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1.5">
                  <Package className="w-4 h-4 text-brand-500" />
                  kg waste collected ({reportsWithWaste} report{reportsWithWaste !== 1 ? 's' : ''})
                </div>
              </div>
            ) : (
              <div className="card text-center opacity-60">
                <div className="text-2xl font-bold text-gray-400">—</div>
                <div className="text-sm text-gray-400 mt-1">No waste quantities recorded yet</div>
              </div>
            )}
            <div className="card text-center">
              <div className="text-4xl font-bold text-purple-600">{catEntries.length}</div>
              <div className="text-sm text-gray-500 mt-1">Waste type{catEntries.length !== 1 ? 's' : ''} cleared</div>
            </div>
          </div>

          {/* Category breakdown */}
          {catEntries.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Resolved by Waste Type</h3>
              <div className="space-y-3">
                {catEntries.map(([cat, count]) => {
                  const pct = Math.round((count / resolvedReports.length) * 100);
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <CategoryBadge category={cat as Report['category']} />
                      </div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resolved report list */}
          {resolvedReports.length === 0 ? (
            <EmptyState
              icon="🌱"
              title="No cleanups recorded yet"
              description="Once reports are marked resolved, they'll appear here."
            />
          ) : (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Cleanup Log</h3>
              <div className="space-y-3">
                {resolvedReports.map((r) => (
                  <div key={r.id} className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800 text-sm">{r.location}</span>
                        <CategoryBadge category={r.category} />
                        {r.isDemo && <span className="text-xs text-gray-400">(demo)</span>}
                      </div>
                      {r.cleanupNote && (
                        <p className="text-sm text-gray-600 mt-1">{r.cleanupNote}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>Resolved {formatDate(r.updatedAt)}</span>
                        {r.wasteCollectedKg !== undefined && r.wasteCollectedKg > 0 && (
                          <span className="text-green-700 font-medium">{r.wasteCollectedKg} kg collected</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
