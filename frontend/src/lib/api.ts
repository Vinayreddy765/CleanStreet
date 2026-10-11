import {
  Report,
  DashboardData,
  CreateReportPayload,
  UpdateReportPayload,
  ReportStatus,
} from './types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const message = data?.error || `HTTP ${res.status}`;
    const details = data?.details ? `: ${data.details}` : '';
    throw new Error(`${message}${details}`);
  }

  return data as T;
}

export interface PresignResponse {
  /** Presigned PUT URL — upload the file directly to this URL */
  uploadUrl: string;
  /** S3 object key — store this in the report (photoUrl / afterPhotoUrl) */
  key: string;
  /** Short-lived presigned GET URL for immediate preview */
  viewUrl: string;
}

export const api = {
  getDashboard(): Promise<DashboardData> {
    return request<DashboardData>('/dashboard');
  },

  getReports(filters?: {
    status?: ReportStatus;
    category?: string;
    severity?: string;
  }): Promise<{ reports: Report[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.severity) params.set('severity', filters.severity);
    const qs = params.toString();
    return request(`/reports${qs ? `?${qs}` : ''}`);
  },

  getReport(id: string): Promise<Report> {
    return request<Report>(`/reports/${id}`);
  },

  createReport(payload: CreateReportPayload): Promise<Report> {
    return request<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateReport(id: string, payload: UpdateReportPayload): Promise<Report> {
    return request<Report>(`/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get a fresh presigned GET URL for an S3 object key.
   * Use this to display uploaded photos in the detail panel.
   */
  getPhotoViewUrl(key: string): Promise<{ viewUrl: string; expiresIn: number }> {
    const params = new URLSearchParams({ key });
    return request<{ viewUrl: string; expiresIn: number }>(`/uploads/view?${params}`);
  },

  /**
   * Request a presigned PUT URL from the backend.
   * The Lambda validates type/size and generates a unique S3 key.
   */
  getPresignedUploadUrl(contentType: string, fileSizeBytes: number): Promise<PresignResponse> {
    return request<PresignResponse>('/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({ contentType, fileSizeBytes }),
    });
  },

  /**
   * Upload a file directly to S3 using the presigned PUT URL.
   * AWS credentials are never exposed — the signed URL is the only auth.
   * Calls onProgress(0–100) as the upload proceeds.
   */
  uploadToS3(
    uploadUrl: string,
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      // Content-Type must exactly match what was signed
      xhr.setRequestHeader('Content-Type', file.type);

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed: HTTP ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('S3 upload failed: network error')));
      xhr.addEventListener('abort', () => reject(new Error('S3 upload cancelled')));

      xhr.send(file);
    });
  },
};
