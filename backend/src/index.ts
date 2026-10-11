import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler as getReports } from './handlers/getReports';
import { handler as postReport } from './handlers/postReport';
import { handler as getReport } from './handlers/getReport';
import { handler as patchReport } from './handlers/patchReport';
import { handler as getDashboard } from './handlers/getDashboard';
import { handler as postPresign } from './handlers/postPresign';
import { handler as getPhotoView } from './handlers/getPhotoView';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Content-Type': 'application/json',
};

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod?.toUpperCase();
  const path = event.path || '';

  console.log(`${method} ${path}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Route: GET /dashboard
  if (method === 'GET' && path === '/dashboard') {
    return getDashboard(event);
  }

  // Route: GET /reports
  if (method === 'GET' && path === '/reports') {
    return getReports(event);
  }

  // Route: POST /reports
  if (method === 'POST' && path === '/reports') {
    return postReport(event);
  }

  // Route: GET /reports/{id}
  if (method === 'GET' && path.match(/^\/reports\/[^/]+$/)) {
    return getReport(event);
  }

  // Route: PATCH /reports/{id}
  if (method === 'PATCH' && path.match(/^\/reports\/[^/]+$/)) {
    return patchReport(event);
  }

  // Route: POST /uploads/presign
  if (method === 'POST' && path === '/uploads/presign') {
    return postPresign(event);
  }

  // Route: GET /uploads/view?key=photos/...
  if (method === 'GET' && path === '/uploads/view') {
    return getPhotoView(event);
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: `Route not found: ${method} ${path}` }),
  };
}
