import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { badRequest, ok, serverError } from '../lib/response';

const VIEW_URL_TTL_SECONDS = 3600; // 1 hour
const KEY_PATTERN = /^photos\/[a-f0-9-]{36}\.(jpg|png|webp)$/;

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET = process.env.PHOTOS_BUCKET!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const key = event.queryStringParameters?.key;
    if (!key) return badRequest('key query parameter is required');

    // Validate key format to prevent path traversal
    if (!KEY_PATTERN.test(key)) {
      return badRequest('Invalid key format');
    }

    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const viewUrl = await getSignedUrl(s3, command, { expiresIn: VIEW_URL_TTL_SECONDS });

    return ok({ viewUrl, expiresIn: VIEW_URL_TTL_SECONDS });
  } catch (err) {
    return serverError(err);
  }
}
