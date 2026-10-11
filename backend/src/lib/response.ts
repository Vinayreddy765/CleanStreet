const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Content-Type': 'application/json',
};

export function ok<T>(body: T, statusCode = 200) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export function created<T>(body: T) {
  return ok(body, 201);
}

export function badRequest(message: string, details?: string) {
  return {
    statusCode: 400,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message, details }),
  };
}

export function notFound(message = 'Resource not found') {
  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

export function serverError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('Server error:', err);
  return {
    statusCode: 500,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: 'Internal server error', details: message }),
  };
}

export function noContent() {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: '',
  };
}
