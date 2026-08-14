import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { entities } from '@/db/schema';
import { ilike, or, eq } from 'drizzle-orm';
import { searchSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  const parsed = searchSchema.safeParse({ q });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid search query' }, { status: 400 });
  }

  const query = `%${parsed.data.q}%`;

  const entityResults = await db
    .select({
      id: entities.id,
      name: entities.name,
      entityType: entities.entityType,
      city: entities.city,
      county: entities.county,
      state: entities.state,
      programStatus: entities.programStatus,
      vendor: entities.vendor,
    })
    .from(entities)
    .where(
      or(
        ilike(entities.name, query),
        ilike(entities.city, query),
        ilike(entities.county, query),
        eq(entities.state, parsed.data.q.toUpperCase()),
      ),
    )
    .limit(20);

  return NextResponse.json(entityResults);
}
