export type WasteCategory = 'plastic' | 'household_waste' | 'construction_debris' | 'other';
export type Severity = 'low' | 'medium' | 'high';
export type ReportStatus = 'open' | 'in_progress' | 'resolved';

export interface Report {
  id: string;
  location: string;
  category: WasteCategory;
  severity: Severity;
  description: string;
  photoUrl?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  cleanupNote?: string;
  afterPhotoUrl?: string;
  wasteCollectedKg?: number;
  isDemo: boolean;
}

export interface PriorityScore {
  total: number;
  severityScore: number;
  recencyScore: number;
  repeatBonus: number;
  breakdown: string;
}

export interface HotspotReport extends Report {
  priorityScore: PriorityScore;
}

export interface DashboardData {
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  hotspots: HotspotReport[];
  recentReports: Report[];
}

export interface CreateReportPayload {
  location: string;
  category: WasteCategory;
  severity: Severity;
  description: string;
  photoUrl?: string;
}

export interface UpdateReportPayload {
  status?: ReportStatus;
  cleanupNote?: string;
  afterPhotoUrl?: string;
  wasteCollectedKg?: number;
}

export const CATEGORY_LABELS: Record<WasteCategory, string> = {
  plastic: 'Plastic',
  household_waste: 'Household Waste',
  construction_debris: 'Construction Debris',
  other: 'Other',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};
