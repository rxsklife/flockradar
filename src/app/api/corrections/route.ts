import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { corrections } from '@/db/schema';
import { correctionSchema } from '@/lib/validations';
import { sendReviewPrompt, type ReviewItem } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = correctionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid correction request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [correction] = await db
    .insert(corrections)
    .values({
      entityName: parsed.data.entityName,
      description: parsed.data.description,
      contactEmail: parsed.data.contactEmail || null,
      status: 'pending',
    })
    .returning({ id: corrections.id, createdAt: corrections.createdAt });


  const item: ReviewItem = {
    kind: 'correction',
    id: correction.id,
    title: parsed.data.entityName,
    summary: parsed.data.description,
    contactEmail: parsed.data.contactEmail || null,
    sourceUrl: null,
    submittedAt: correction.createdAt
      ? new Date(correction.createdAt).toLocaleString()
      : 'just now',
  };
  void sendReviewPrompt(item);

  return NextResponse.json(
    { message: 'Correction request received. We will review within 72 hours.' },
    { status: 201 },
  );
}
