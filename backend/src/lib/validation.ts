import { CreateReportInput, UpdateReportInput, WasteCategory, Severity, ReportStatus } from './types';

const VALID_CATEGORIES: WasteCategory[] = ['plastic', 'household_waste', 'construction_debris', 'other'];
const VALID_SEVERITIES: Severity[] = ['low', 'medium', 'high'];
const VALID_STATUSES: ReportStatus[] = ['open', 'in_progress', 'resolved'];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCreateReport(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const data = body as Record<string, unknown>;

  if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
    errors.push('location is required and must be a non-empty string');
  } else if (data.location.trim().length > 500) {
    errors.push('location must be 500 characters or fewer');
  }

  if (!data.category || !VALID_CATEGORIES.includes(data.category as WasteCategory)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!data.severity || !VALID_SEVERITIES.includes(data.severity as Severity)) {
    errors.push(`severity must be one of: ${VALID_SEVERITIES.join(', ')}`);
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('description is required and must be a non-empty string');
  } else if (data.description.trim().length > 2000) {
    errors.push('description must be 2000 characters or fewer');
  }

  if (data.photoUrl !== undefined && data.photoUrl !== null && data.photoUrl !== '') {
    if (typeof data.photoUrl !== 'string') {
      errors.push('photoUrl must be a string');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateUpdateReport(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const data = body as Record<string, unknown>;

  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as ReportStatus)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (data.cleanupNote !== undefined && typeof data.cleanupNote !== 'string') {
    errors.push('cleanupNote must be a string');
  }

  if (data.afterPhotoUrl !== undefined && data.afterPhotoUrl !== '' && typeof data.afterPhotoUrl !== 'string') {
    errors.push('afterPhotoUrl must be a string');
  }

  if (data.wasteCollectedKg !== undefined) {
    const kg = Number(data.wasteCollectedKg);
    if (isNaN(kg) || kg < 0) {
      errors.push('wasteCollectedKg must be a non-negative number');
    }
  }

  // Require cleanupNote when resolving
  if (data.status === 'resolved' && (!data.cleanupNote || typeof data.cleanupNote !== 'string' || (data.cleanupNote as string).trim().length === 0)) {
    errors.push('cleanupNote is required when resolving a report');
  }

  return { valid: errors.length === 0, errors };
}

export function parseCreateInput(body: Record<string, unknown>): CreateReportInput {
  return {
    location: (body.location as string).trim(),
    category: body.category as WasteCategory,
    severity: body.severity as Severity,
    description: (body.description as string).trim(),
    photoUrl: body.photoUrl ? (body.photoUrl as string).trim() : undefined,
    isDemo: body.isDemo === true,
  };
}

export function parseUpdateInput(body: Record<string, unknown>): UpdateReportInput {
  const input: UpdateReportInput = {};
  if (body.status) input.status = body.status as ReportStatus;
  if (body.cleanupNote) input.cleanupNote = (body.cleanupNote as string).trim();
  if (body.afterPhotoUrl) input.afterPhotoUrl = (body.afterPhotoUrl as string).trim();
  if (body.wasteCollectedKg !== undefined && body.wasteCollectedKg !== null) {
    input.wasteCollectedKg = Number(body.wasteCollectedKg);
  }
  return input;
}
