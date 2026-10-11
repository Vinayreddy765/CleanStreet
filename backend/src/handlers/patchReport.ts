import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getReport, updateReport } from '../lib/db';
import { ok, notFound, badRequest, serverError } from '../lib/response';
import { validateUpdateReport, parseUpdateInput } from '../lib/validation';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  open: ['in_progress'],
  in_progress: ['resolved', 'open'],
  resolved: [],
};

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest('Report ID is required');

    let body: unknown;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return badRequest('Invalid JSON in request body');
    }

    const { valid, errors } = validateUpdateReport(body);
    if (!valid) {
      return badRequest('Validation failed', errors.join('; '));
    }

    // Check the report exists
    const existing = await getReport(id);
    if (!existing) return notFound(`Report ${id} not found`);

    const input = parseUpdateInput(body as Record<string, unknown>);

    // Validate status transition
    if (input.status && input.status !== existing.status) {
      const allowed = STATUS_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(input.status)) {
        return badRequest(
          `Cannot transition from '${existing.status}' to '${input.status}'. ` +
          `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none'}`
        );
      }
    }

    const updates = {
      ...input,
      updatedAt: new Date().toISOString(),
    };

    const updated = await updateReport(id, updates);
    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
}
