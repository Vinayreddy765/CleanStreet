import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { listReports } from '../lib/db';
import { ok, badRequest, serverError } from '../lib/response';
import { ReportStatus } from '../lib/types';

const VALID_STATUSES = ['open', 'in_progress', 'resolved'];
const VALID_CATEGORIES = ['plastic', 'household_waste', 'construction_debris', 'other'];
const VALID_SEVERITIES = ['low', 'medium', 'high'];

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const qs = event.queryStringParameters || {};

    if (qs.status && !VALID_STATUSES.includes(qs.status)) {
      return badRequest(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    if (qs.category && !VALID_CATEGORIES.includes(qs.category)) {
      return badRequest(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    if (qs.severity && !VALID_SEVERITIES.includes(qs.severity)) {
      return badRequest(`Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`);
    }

    const reports = await listReports({
      status: qs.status as ReportStatus | undefined,
      category: qs.category,
      severity: qs.severity,
    });

    return ok({ reports, count: reports.length });
  } catch (err) {
    return serverError(err);
  }
}
