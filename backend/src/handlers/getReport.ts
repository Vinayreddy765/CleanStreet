import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getReport } from '../lib/db';
import { ok, notFound, badRequest, serverError } from '../lib/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest('Report ID is required');

    const report = await getReport(id);
    if (!report) return notFound(`Report ${id} not found`);

    return ok(report);
  } catch (err) {
    return serverError(err);
  }
}
