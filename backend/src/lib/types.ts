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

export interface CreateReportInput {
  location: string;
  category: WasteCategory;
  severity: Severity;
  description: string;
  photoUrl?: string;
  isDemo?: boolean;
}

export interface UpdateReportInput {
  status?: ReportStatus;
  cleanupNote?: string;
  afterPhotoUrl?: string;
  wasteCollectedKg?: number;
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

export interface ApiResponse<T = unknown> {
  statusCode: number;
  body: T;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
