import { Report, HotspotReport, PriorityScore } from './types';

function severityScore(severity: string): number {
  switch (severity) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 1;
  }
}

function recencyScore(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 7) return 3;
  if (ageDays <= 30) return 2;
  return 1;
}

function buildLocationMap(reports: Report[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of reports) {
    if (r.status !== 'resolved') {
      const key = r.location.toLowerCase().trim();
      map.set(key, (map.get(key) || 0) + 1);
    }
  }
  return map;
}

export function calculatePriorityScore(
  report: Report,
  locationMap: Map<string, number>
): PriorityScore {
  const sv = severityScore(report.severity);
  const rc = recencyScore(report.createdAt);
  const locationKey = report.location.toLowerCase().trim();
  const repeatCount = locationMap.get(locationKey) || 1;
  const rb = repeatCount >= 2 ? 1 : 0;
  const total = sv + rc + rb;

  const ageDays = Math.floor(
    (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const parts: string[] = [
    `Severity: ${report.severity} (+${sv})`,
    `Reported ${ageDays}d ago (+${rc})`,
  ];
  if (rb > 0) parts.push(`${repeatCount} reports at this location (+${rb})`);

  return {
    total,
    severityScore: sv,
    recencyScore: rc,
    repeatBonus: rb,
    breakdown: parts.join(', '),
  };
}

export function computeHotspots(
  reports: Report[],
  topN = 5
): HotspotReport[] {
  // Only rank open and in-progress reports
  const activeReports = reports.filter((r) => r.status !== 'resolved');
  const locationMap = buildLocationMap(reports);

  return activeReports
    .map((r) => ({
      ...r,
      priorityScore: calculatePriorityScore(r, locationMap),
    }))
    .sort((a, b) => b.priorityScore.total - a.priorityScore.total)
    .slice(0, topN);
}
