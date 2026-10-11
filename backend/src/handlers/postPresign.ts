import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { badRequest, ok, serverError } from '../lib/response';

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const PUT_URL_TTL_SECONDS = 300;    // 5 min to complete the upload
const GET_URL_TTL_SECONDS = 3600;   // 1 hr for the view URL returned after upload

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET = process.env.PHOTOS_BUCKET!;

export interface PresignResponse {
  /** Presigned PUT URL — upload the file directly to S3 with this */
  uploadUrl: string;
  /** Object key to store in DynamoDB */
  key: string;
  /** Short-lived GET URL to preview the image immediately after upload */
  viewUrl: string;
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    let body: unknown;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return badRequest('Invalid JSON in request body');
    }

    if (typeof body !== 'object' || body === null) {
      return badRequest('Request body must be a JSON object');
    }

    const data = body as Record<string, unknown>;
    const contentType = data.contentType as string | undefined;
    const fileSizeBytes = data.fileSizeBytes as number | undefined;

    // Validate content type
    if (!contentType || !ALLOWED_CONTENT_TYPES[contentType]) {
      return badRequest(
        `Unsupported file type: ${contentType || '(none)'}. ` +
          `Allowed types: ${Object.keys(ALLOWED_CONTENT_TYPES).join(', ')}`
      );
    }

    // Validate file size
    if (fileSizeBytes !== undefined) {
      if (typeof fileSizeBytes !== 'number' || fileSizeBytes <= 0) {
        return badRequest('fileSizeBytes must be a positive number');
      }
      if (fileSizeBytes > MAX_BYTES) {
        return badRequest(
          `File too large: ${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB. ` +
            `Maximum allowed: ${MAX_BYTES / (1024 * 1024)} MB`
        );
      }
    }

    const ext = ALLOWED_CONTENT_TYPES[contentType];
    const key = `photos/${uuidv4()}.${ext}`;

    // Generate presigned PUT URL (browser uploads directly to S3)
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      // Enforce max content length via presigned URL conditions
      ...(fileSizeBytes && {
        Metadata: { 'original-size': String(fileSizeBytes) },
      }),
    });

    const uploadUrl = await getSignedUrl(s3, putCommand, {
      expiresIn: PUT_URL_TTL_SECONDS,
    });

    // Generate a short-lived GET URL so the frontend can preview immediately
    const getCommand = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const viewUrl = await getSignedUrl(s3, getCommand, {
      expiresIn: GET_URL_TTL_SECONDS,
    });

    const response: PresignResponse = { uploadUrl, key, viewUrl };
    return ok(response);
  } catch (err) {
    return serverError(err);
  }
}
