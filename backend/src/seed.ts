/**
 * Seed script — inserts demo reports into DynamoDB.
 * Run: npm run seed  (uses ts-node)
 * Or after build: npm run seed:compiled
 *
 * All records have isDemo: true so they can be filtered / deleted separately.
 * Safe to run multiple times — uses fixed UUIDs so duplicates are overwritten.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { Report } from './lib/types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TABLE_NAME || 'CleanStreetReports';

// Fixed IDs so the seed is idempotent
const DEMO_REPORTS: Report[] = [
  {
    id: 'demo-001',
    location: 'Oak Street & 5th Avenue',
    category: 'plastic',
    severity: 'high',
    description: 'Large pile of plastic bottles and packaging dumped on the corner. Blocking part of the footpath.',
    status: 'open',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    isDemo: true,
  },
  {
    id: 'demo-002',
    location: 'Riverside Drive (near bridge)',
    category: 'household_waste',
    severity: 'high',
    description: 'Sofa, mattress, and several bin bags full of household items dumped on the verge.',
    status: 'open',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    isDemo: true,
  },
  {
    id: 'demo-003',
    location: 'Industrial Road, Unit 7 entrance',
    category: 'construction_debris',
    severity: 'high',
    description: 'Broken concrete slabs, bricks, and metal rods dumped outside the entrance. Hazardous.',
    photoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    status: 'in_progress',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
    isDemo: true,
  },
  {
    id: 'demo-004',
    location: 'Oak Street & 5th Avenue',
    category: 'plastic',
    severity: 'medium',
    description: 'Additional plastic bags and drinks cans scattered near the same corner as a previous report.',
    status: 'open',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    isDemo: true,
  },
  {
    id: 'demo-005',
    location: 'Green Park entrance path',
    category: 'other',
    severity: 'low',
    description: 'Fast-food wrappers and paper cups left along the path leading to the park entrance.',
    status: 'open',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
    isDemo: true,
  },
  {
    id: 'demo-006',
    location: 'Maple Avenue bus stop',
    category: 'plastic',
    severity: 'medium',
    description: 'Overflowing bin with waste scattered on the pavement around the bus shelter.',
    status: 'in_progress',
    createdAt: daysAgo(14),
    updatedAt: daysAgo(4),
    isDemo: true,
  },
  {
    id: 'demo-007',
    location: 'Station Road underpass',
    category: 'household_waste',
    severity: 'medium',
    description: 'Several bin bags of household waste abandoned in the underpass.',
    status: 'resolved',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(20),
    cleanupNote: 'Council cleanup team removed all waste. Area is clear.',
    wasteCollectedKg: 48,
    isDemo: true,
  },
  {
    id: 'demo-008',
    location: 'Elm Court car park',
    category: 'construction_debris',
    severity: 'low',
    description: 'Small amount of rubble and broken tiles left in the corner of the car park.',
    status: 'resolved',
    createdAt: daysAgo(45),
    updatedAt: daysAgo(35),
    cleanupNote: 'Debris bagged and collected by local volunteers during a community cleanup day.',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1504945005722-33670dcaf685?w=800',
    wasteCollectedKg: 12,
    isDemo: true,
  },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function seed() {
  console.log(`\n🌱 Seeding demo data into table: ${TABLE_NAME}\n`);

  let inserted = 0;
  for (const report of DEMO_REPORTS) {
    try {
      await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: report }));
      console.log(`  ✓ ${report.id}  [${report.status}]  ${report.location}`);
      inserted++;
    } catch (err) {
      console.error(`  ✗ ${report.id}  ${err}`);
    }
  }

  console.log(`\nDone — ${inserted}/${DEMO_REPORTS.length} demo reports seeded.\n`);
}

async function clearDemo() {
  console.log(`\n🧹 Removing demo data from table: ${TABLE_NAME}\n`);
  let removed = 0;
  for (const report of DEMO_REPORTS) {
    try {
      await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id: report.id } }));
      console.log(`  ✓ removed ${report.id}`);
      removed++;
    } catch (err) {
      console.error(`  ✗ ${report.id}  ${err}`);
    }
  }
  console.log(`\nDone — ${removed}/${DEMO_REPORTS.length} demo reports removed.\n`);
}

const action = process.argv[2];
if (action === 'clear') {
  clearDemo().catch(console.error);
} else {
  seed().catch(console.error);
}
