import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Report, ReportStatus } from './types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLE_NAME = process.env.TABLE_NAME || 'CleanStreetReports';

export async function getReport(id: string): Promise<Report | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { id } })
  );
  return (result.Item as Report) || null;
}

export async function putReport(report: Report): Promise<void> {
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: report }));
}

export async function updateReport(
  id: string,
  updates: Partial<Report>
): Promise<Report | null> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const attrName = `#${key}`;
      const attrValue = `:${key}`;
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    }
  }

  if (updateExpressions.length === 0) return getReport(id);

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(id)',
    })
  );
  return (result.Attributes as Report) || null;
}

export async function listReports(filters?: {
  status?: ReportStatus;
  category?: string;
  severity?: string;
}): Promise<Report[]> {
  let items: Report[] = [];

  // If filtering by status, use GSI for efficiency
  if (filters?.status) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': filters.status },
        ScanIndexForward: false, // newest first
      })
    );
    items = (result.Items as Report[]) || [];
  } else {
    // Full scan sorted by createdAt descending
    const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    items = (result.Items as Report[]) || [];
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // Apply additional filters in memory
  if (filters?.category) {
    items = items.filter((r) => r.category === filters.category);
  }
  if (filters?.severity) {
    items = items.filter((r) => r.severity === filters.severity);
  }

  return items;
}

export async function getAllReports(): Promise<Report[]> {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  return ((result.Items as Report[]) || []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}
