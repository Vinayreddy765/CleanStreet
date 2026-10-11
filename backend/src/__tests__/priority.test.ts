import { calculatePriorityScore, computeHotspots } from '../lib/priority';
import { Report } from '../lib/types';

function makeReport(overrides: Partial<Report> = {}): Report {
  const now = new Date().toISOString();
  return {
    id: 'test-1',
    location: 'Test Street',
    category: 'plastic',
    severity: 'medium',
    description: 'Test',
    status: 'open',
    createdAt: now,
    updatedAt: now,
    isDemo: false,
    ...overrides,
  };
}

describe('calculatePriorityScore', () => {
  it('gives high severity score 3', () => {
    const r = makeReport({ severity: 'high' });
    const score = calculatePriorityScore(r, new Map());
    expect(score.severityScore).toBe(3);
  });

  it('gives medium severity score 2', () => {
    const r = makeReport({ severity: 'medium' });
    const score = calculatePriorityScore(r, new Map());
    expect(score.severityScore).toBe(2);
  });

  it('gives low severity score 1', () => {
    const r = makeReport({ severity: 'low' });
    const score = calculatePriorityScore(r, new Map());
    expect(score.severityScore).toBe(1);
  });

  it('gives recency score 3 for report created today', () => {
    const r = makeReport({ createdAt: new Date().toISOString() });
    const score = calculatePriorityScore(r, new Map());
    expect(score.recencyScore).toBe(3);
  });

  it('gives recency score 1 for report created 60 days ago', () => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    const r = makeReport({ createdAt: d.toISOString() });
    const score = calculatePriorityScore(r, new Map());
    expect(score.recencyScore).toBe(1);
  });

  it('adds repeat bonus when location has 2+ reports', () => {
    const r = makeReport({ location: 'Oak Street' });
    const locationMap = new Map([['oak street', 3]]);
    const score = calculatePriorityScore(r, locationMap);
    expect(score.repeatBonus).toBe(1);
  });

  it('no repeat bonus for unique location', () => {
    const r = makeReport({ location: 'Unique Lane' });
    const score = calculatePriorityScore(r, new Map());
    expect(score.repeatBonus).toBe(0);
  });

  it('total score is sum of components', () => {
    const r = makeReport({ severity: 'high', createdAt: new Date().toISOString(), location: 'Oak Street' });
    const locationMap = new Map([['oak street', 2]]);
    const score = calculatePriorityScore(r, locationMap);
    expect(score.total).toBe(score.severityScore + score.recencyScore + score.repeatBonus);
    expect(score.total).toBe(7); // 3 + 3 + 1
  });
});

describe('computeHotspots', () => {
  it('returns at most topN results', () => {
    const reports = Array.from({ length: 10 }, (_, i) =>
      makeReport({ id: `r${i}`, severity: 'low' })
    );
    expect(computeHotspots(reports, 5)).toHaveLength(5);
  });

  it('excludes resolved reports', () => {
    const reports = [
      makeReport({ id: 'r1', severity: 'high', status: 'resolved' }),
      makeReport({ id: 'r2', severity: 'low', status: 'open' }),
    ];
    const hotspots = computeHotspots(reports, 5);
    expect(hotspots.every((h) => h.status !== 'resolved')).toBe(true);
  });

  it('sorts highest score first', () => {
    const reports = [
      makeReport({ id: 'r1', severity: 'low', status: 'open' }),
      makeReport({ id: 'r2', severity: 'high', status: 'open' }),
    ];
    const hotspots = computeHotspots(reports, 5);
    expect(hotspots[0].id).toBe('r2');
  });

  it('includes priorityScore in each result', () => {
    const reports = [makeReport()];
    const hotspots = computeHotspots(reports, 5);
    expect(hotspots[0].priorityScore).toBeDefined();
    expect(typeof hotspots[0].priorityScore.total).toBe('number');
    expect(typeof hotspots[0].priorityScore.breakdown).toBe('string');
  });
});
