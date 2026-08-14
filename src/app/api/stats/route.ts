import { NextResponse } from 'next/server';
import { db } from '@/db';
import { entities, locations, sources } from '@/db/schema';
import { count, eq, sql } from 'drizzle-orm';

export async function GET() {
  const [entityCount, stateCount, locationCount, sourceCount] = await Promise.all([
    db.select({ value: count() }).from(entities),
    db
      .select({ value: count(sql`DISTINCT ${entities.state}`) })
      .from(entities),
    db
      .select({ value: count() })
      .from(locations)
      .where(eq(locations.publicVisible, true)),
    db.select({ value: count() }).from(sources),
  ]);

  return NextResponse.json({
    entities: entityCount[0]?.value ?? 0,
    states: stateCount[0]?.value ?? 0,
    locations: locationCount[0]?.value ?? 0,
    sources: sourceCount[0]?.value ?? 0,
  });
}
