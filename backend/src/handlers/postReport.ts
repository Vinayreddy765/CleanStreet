import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { putReport } from '../lib/db';
import { created, badRequest, serverError } from '../lib/response';
import { validateCreateReport, parseCreateInput } from '../lib/validation';
import { Report } from '../lib/types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    let body: unknown;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return badRequest('Invalid JSON in request body');
    }

    const { valid, errors } = validateCreateReport(body);
    if (!valid) {
      return badRequest('Validation failed', errors.join('; '));
    }

    const input = parseCreateInput(body as Record<string, unknown>);
    const now = new Date().toISOString();

    const report: Report = {
      id: uuidv4(),
      location: input.location,
      category: input.category,
      severity: input.severity,
      description: input.description,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      isDemo: input.isDemo || false,
      ...(input.photoUrl && { photoUrl: input.photoUrl }),
    };

    await putReport(report);
    return created(report);
  } catch (err) {
    return serverError(err);
  }
}
