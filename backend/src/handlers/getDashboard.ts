import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAllReports } from '../lib/db';
import { ok, serverError } from '../lib/response';
import { computeHotspots } from '../lib/priority';

export async function handler(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const allReports = await getAllReports();

    const stats = {
      total: allReports.length,
      open: allReports.filter((r) => r.status === 'open').length,
      inProgress: allReports.filter((r) => r.status === 'in_progress').length,
      resolved: allReports.filter((r) => r.status === 'resolved').length,
    };

    const hotspots = computeHotspots(allReports, 5);
    const recentReports = allReports.slice(0, 10); // already sorted newest first

    return ok({ stats, hotspots, recentReports });
  } catch (err) {
    return serverError(err);
  }
}
