import { NextResponse } from 'next/server';
import { db } from '@/db';
import { changelog } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const entries = await db
    .select()
    .from(changelog)
    .orderBy(desc(changelog.createdAt))
    .limit(50);

  return NextResponse.json(entries);
}
