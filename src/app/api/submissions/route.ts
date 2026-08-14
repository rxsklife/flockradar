import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { submissions } from '@/db/schema';
import { submissionSchema } from '@/lib/validations';
import { sendReviewPrompt, type ReviewItem } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = submissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid submission', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [submission] = await db
    .insert(submissions)
    .values({
      locationDescription: parsed.data.locationDescription || null,
      city: parsed.data.city || null,
      county: parsed.data.county || null,
      state: parsed.data.state,
      observation: parsed.data.observation || null,
      evidenceType: parsed.data.evidenceType,
      sourceUrl: parsed.data.sourceUrl || null,
      observedDate: parsed.data.observedDate || null,
      contactEmail: parsed.data.contactEmail || null,
      rightToShareConfirmed: parsed.data.rightToShareConfirmed,
      status: 'pending',
    })
    .returning({ id: submissions.id, createdAt: submissions.createdAt });



  const item: ReviewItem = {
    kind: 'tip',
    id: submission.id,
    title: [parsed.data.city, parsed.data.state].filter(Boolean).join(', ') || 'Untitled tip',
    summary: parsed.data.observation || parsed.data.locationDescription || '(no details)',
    contactEmail: parsed.data.contactEmail || null,
    sourceUrl: parsed.data.sourceUrl || null,
    submittedAt: submission.createdAt
      ? new Date(submission.createdAt).toLocaleString()
      : 'just now',
  };
  void sendReviewPrompt(item);

  return NextResponse.json({ id: submission.id, status: 'pending' }, { status: 201 });
}
