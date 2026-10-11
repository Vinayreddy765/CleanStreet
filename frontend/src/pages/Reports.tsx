import React, { useEffect, useState, useCallback } from 'react';
import {
  MapPin, ChevronRight, Filter, RefreshCw, CheckCircle2, Clock,
  AlertTriangle, X, ExternalLink
} from 'lucide-react';
import { api } from '../lib/api';
import { Report, ReportStatus, WasteCategory, Severity, CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS } from '../lib/types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../components/Badge';
import { ImageUpload, UploadState, getUploadKey } from '../components/ImageUpload';
import { formatDateTime, daysAgo } from '../lib/utils';

export function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);

  const [filterStatus, setFilterStatus] = useState<ReportStatus | ''>('');
  const [filterCategory, setFilterCategory] = useState<WasteCategory | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<Severity | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { reports: rs } = await api.getReports({
        status: filterStatus || undefined,
        category: filterCategory || undefined,
        severity: filterSeverity || undefined,
      });
      setReports(rs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterSeverity]);

  useEffect(() => { load(); }, [load]);

  // Refresh selected report after update
  async function refreshSelected(id: string) {
    try {
      const r = await api.getReport(id);
      setSelected(r);
      setReports((prev) => prev.map((x) => (x.id === id ? r : x)));
    } catch {/* ignore */}
  }

  const activeFilters = [filterStatus, filterCategory, filterSeverity].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Reports</h2>
          <p className="text-sm text-gray-500 mt-1">{reports.length} report{reports.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
          <Filter className="w-4 h-4" /> Filters
          {activeFilters > 0 && (
            <span className="bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilters}</span>
          )}
        </div>
        <select className="input text-sm py-1.5 w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ReportStatus | '')}>
          <option value="">All Statuses</option>
          {(Object.entries(STATUS_LABELS) as [ReportStatus, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="input text-sm py-1.5 w-auto" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as WasteCategory | '')}>
          <option value="">All Categories</option>
          {(Object.entries(CATEGORY_LABELS) as [WasteCategory, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="input text-sm py-1.5 w-auto" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as Severity | '')}>
          <option value="">All Severities</option>
          {(Object.entries(SEVERITY_LABELS) as [Severity, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {activeFilters > 0 && (
          <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1" onClick={() => { setFilterStatus(''); setFilterCategory(''); setFilterSeverity(''); }}>
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : reports.length === 0 ? (
        <EmptyState icon="🌿" title="No reports found" description="No reports match the current filters." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Severity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Reported</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-800 truncate max-w-[180px]">{r.location}</span>
                        {r.isDemo && <span className="text-xs text-gray-400">(demo)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell"><CategoryBadge category={r.category} /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><SeverityBadge severity={r.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{daysAgo(r.createdAt)}</td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <ReportDetail
          report={selected}
          onClose={() => setSelected(null)}
          onUpdated={(id) => refreshSelected(id)}
        />
      )}
    </div>
  );
}

// ---- Detail panel ----

interface DetailProps {
  report: Report;
  onClose: () => void;
  onUpdated: (id: string) => void;
}

function ReportDetail({ report: r, onClose, onUpdated }: DetailProps) {
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [cleanupNote, setCleanupNote] = useState('');
  const [afterPhotoUpload, setAfterPhotoUpload] = useState<UploadState>({ status: 'idle' });
  const [wasteKg, setWasteKg] = useState('');
  const [noteError, setNoteError] = useState('');

  // Presigned view URLs for S3-stored photos (keys starting with "photos/")
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);
  const [afterPhotoViewUrl, setAfterPhotoViewUrl] = useState<string | null>(null);

  // Fetch presigned GET URLs for any S3 keys stored on the report
  useEffect(() => {
    async function fetchViewUrl(key: string): Promise<string | null> {
      if (!key.startsWith('photos/')) return key; // legacy plain URL — use as-is
      try {
        const { viewUrl } = await api.getPhotoViewUrl(key);
        return viewUrl;
      } catch {
        return null;
      }
    }

    if (r.photoUrl) {
      fetchViewUrl(r.photoUrl).then(setPhotoViewUrl);
    } else {
      setPhotoViewUrl(null);
    }

    if (r.afterPhotoUrl) {
      fetchViewUrl(r.afterPhotoUrl).then(setAfterPhotoViewUrl);
    } else {
      setAfterPhotoViewUrl(null);
    }
  }, [r.photoUrl, r.afterPhotoUrl]);

  async function advanceStatus() {
    const next: ReportStatus = r.status === 'open' ? 'in_progress' : 'resolved';
    if (next === 'resolved') { setShowResolveForm(true); return; }
    await doUpdate({ status: next });
  }

  async function submitResolve(e: React.FormEvent) {
    e.preventDefault();
    if (!cleanupNote.trim()) { setNoteError('Cleanup note is required'); return; }
    if (afterPhotoUpload.status === 'uploading' || afterPhotoUpload.status === 'validating') {
      setNoteError('Please wait for the photo upload to finish'); return;
    }
    setNoteError('');
    const afterPhotoKey = getUploadKey(afterPhotoUpload);
    const payload: Parameters<typeof api.updateReport>[1] = {
      status: 'resolved',
      cleanupNote: cleanupNote.trim(),
      ...(afterPhotoKey && { afterPhotoUrl: afterPhotoKey }),
      ...(wasteKg && !isNaN(Number(wasteKg)) && Number(wasteKg) >= 0 && { wasteCollectedKg: Number(wasteKg) }),
    };
    await doUpdate(payload);
    setShowResolveForm(false);
  }

  async function doUpdate(payload: Parameters<typeof api.updateReport>[1]) {
    setUpdating(true);
    setUpdateError(null);
    try {
      await api.updateReport(r.id, payload);
      onUpdated(r.id);
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  }

  // Helper: render a photo — handles presigned S3 URLs and missing images
  function PhotoDisplay({ src, alt, label }: { src: string | null | undefined; alt: string; label: string }) {
    if (!src) return null;
    return (
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">{label}</p>
        <img src={src} alt={alt} className="rounded-lg w-full max-h-48 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <a href={src} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-1">
          <ExternalLink className="w-3 h-3" /> View full image
        </a>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-semibold text-gray-900">Report Detail</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={r.status} />
            <SeverityBadge severity={r.severity} />
            <CategoryBadge category={r.category} />
            {r.isDemo && <span className="badge text-gray-500 bg-gray-100">Demo Data</span>}
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Location</p>
            <p className="font-medium text-gray-900 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-gray-400" /> {r.location}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Description</p>
            <p className="text-gray-700 text-sm mt-1">{r.description}</p>
          </div>

          {r.photoUrl && (
            <PhotoDisplay
              src={photoViewUrl}
              alt="Report photo"
              label="Photo"
            />
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Reported</p>
              <p className="text-gray-700 mt-1">{formatDateTime(r.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Last Updated</p>
              <p className="text-gray-700 mt-1">{formatDateTime(r.updatedAt)}</p>
            </div>
          </div>

          {r.cleanupNote && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Cleanup Note
              </p>
              <p className="text-sm text-green-900">{r.cleanupNote}</p>
              {r.wasteCollectedKg !== undefined && (
                <p className="text-sm text-green-700 font-medium">Waste collected: {r.wasteCollectedKg} kg</p>
              )}
              {r.afterPhotoUrl && (
                <PhotoDisplay
                  src={afterPhotoViewUrl}
                  alt="After-cleanup photo"
                  label="After-cleanup photo"
                />
              )}
            </div>
          )}

          {updateError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{updateError}</span>
            </div>
          )}

          {/* Resolve form */}
          {showResolveForm && (
            <form onSubmit={submitResolve} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
              <p className="font-medium text-gray-800 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" /> Mark as Resolved
              </p>
              <div>
                <label className="label text-xs" htmlFor="cleanupNote">
                  Cleanup Note <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="cleanupNote"
                  rows={3}
                  className={`input text-sm resize-none ${noteError ? 'border-red-400' : ''}`}
                  placeholder="What was done? Who cleaned up?"
                  value={cleanupNote}
                  onChange={(e) => { setCleanupNote(e.target.value); if (noteError) setNoteError(''); }}
                />
                {noteError && <p className="text-red-600 text-xs mt-1">{noteError}</p>}
              </div>
              <div>
                <label className="label text-xs" htmlFor="wasteKg">Waste Collected (kg)</label>
                <input
                  id="wasteKg"
                  type="number"
                  min="0"
                  step="0.1"
                  className="input text-sm"
                  placeholder="Optional"
                  value={wasteKg}
                  onChange={(e) => setWasteKg(e.target.value)}
                />
              </div>
              {/* After-cleanup photo upload */}
              <ImageUpload
                label="After-cleanup photo"
                optional
                onChange={setAfterPhotoUpload}
                disabled={updating}
              />
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn-secondary text-sm" onClick={() => setShowResolveForm(false)}>Cancel</button>
                <button
                  type="submit"
                  className="btn-primary text-sm"
                  disabled={
                    updating ||
                    afterPhotoUpload.status === 'uploading' ||
                    afterPhotoUpload.status === 'validating'
                  }
                >
                  {updating ? 'Saving…' : 'Confirm Resolved'}
                </button>
              </div>
            </form>
          )}

          {/* Status advance buttons */}
          {!showResolveForm && r.status !== 'resolved' && (
            <div className="flex gap-2 pt-1">
              <button className="btn-primary flex-1 justify-center" onClick={advanceStatus} disabled={updating}>
                {updating ? 'Updating…' : r.status === 'open' ? (
                  <><Clock className="w-4 h-4" /> Mark In Progress</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Mark Resolved</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
