import { Severity, ReportStatus, WasteCategory } from './types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function severityColor(s: Severity): string {
  return { low: 'text-blue-700 bg-blue-50', medium: 'text-amber-700 bg-amber-50', high: 'text-red-700 bg-red-50' }[s];
}

export function severityDot(s: Severity): string {
  return { low: 'bg-blue-500', medium: 'bg-amber-500', high: 'bg-red-500' }[s];
}

export function statusColor(s: ReportStatus): string {
  return {
    open: 'text-orange-700 bg-orange-50',
    in_progress: 'text-blue-700 bg-blue-50',
    resolved: 'text-green-700 bg-green-50',
  }[s];
}

export function statusDot(s: ReportStatus): string {
  return {
    open: 'bg-orange-500',
    in_progress: 'bg-blue-500',
    resolved: 'bg-green-500',
  }[s];
}

export function categoryColor(c: WasteCategory): string {
  return {
    plastic: 'text-cyan-700 bg-cyan-50',
    household_waste: 'text-purple-700 bg-purple-50',
    construction_debris: 'text-stone-700 bg-stone-100',
    other: 'text-gray-700 bg-gray-100',
  }[c];
}

export function categoryIcon(c: WasteCategory): string {
  return { plastic: '🧴', household_waste: '🏠', construction_debris: '🧱', other: '♻️' }[c];
}
