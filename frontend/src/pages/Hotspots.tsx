import React, { useEffect, useState, useCallback } from 'react';
import { Flame, MapPin, RefreshCw, Info } from 'lucide-react';
import { api } from '../lib/api';
import { HotspotReport } from '../lib/types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';
import { SeverityBadge, CategoryBadge, StatusBadge } from '../components/Badge';
import { daysAgo } from '../lib/utils';

export function Hotspots() {
  const [hotspots, setHotspots] = useState<HotspotReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard();
      setHotspots(data.hotspots);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load hotspots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" /> Priority Hotspots
          </h2>
          <p className="text-sm text-gray-500 mt-1">Active reports ranked by cleanup urgency</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Scoring explanation */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="font-medium text-amber-800 text-sm flex items-center gap-1.5 mb-2">
          <Info className="w-4 h-4" /> How priority scores are calculated
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-amber-700">
          <div className="bg-amber-100 rounded-lg p-2">
            <p className="font-semibold">Severity (1–3)</p>
            <p>High=3 · Medium=2 · Low=1</p>
          </div>
          <div className="bg-amber-100 rounded-lg p-2">
            <p className="font-semibold">Recency (1–3)</p>
            <p>≤7 days=3 · ≤30 days=2 · Older=1</p>
          </div>
          <div className="bg-amber-100 rounded-lg p-2">
            <p className="font-semibold">Repeat Location (+1)</p>
            <p>2+ open reports at same address</p>
          </div>
        </div>
        <p className="text-xs text-amber-600 mt-2">Maximum possible score: 7. Only open and in-progress reports are ranked.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Computing hotspots…" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : hotspots.length === 0 ? (
        <EmptyState
          icon="🌿"
          title="No active hotspots"
          description="All reported locations have been resolved. Great work!"
        />
      ) : (
        <div className="space-y-4">
          {hotspots.map((h, i) => {
            const pct = Math.round((h.priorityScore.total / 7) * 100);
            const barColor = h.priorityScore.total >= 6 ? 'bg-red-500' : h.priorityScore.total >= 4 ? 'bg-amber-500' : 'bg-blue-500';

            return (
              <div key={h.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Rank badge */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                    i === 0 ? 'bg-red-100 text-red-700' :
                    i === 1 ? 'bg-orange-100 text-orange-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                          {h.location}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <SeverityBadge severity={h.severity} />
                          <CategoryBadge category={h.category} />
                          <StatusBadge status={h.status} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-gray-900">{h.priorityScore.total}</div>
                        <div className="text-xs text-gray-400">/ 7 pts</div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="mt-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>Severity +{h.priorityScore.severityScore}</span>
                      <span>Recency +{h.priorityScore.recencyScore}</span>
                      {h.priorityScore.repeatBonus > 0 && (
                        <span className="text-orange-600 font-medium">Repeat location +{h.priorityScore.repeatBonus}</span>
                      )}
                    </div>

                    {/* Description preview */}
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{h.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Reported {daysAgo(h.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
