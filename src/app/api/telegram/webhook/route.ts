import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { submissions, corrections, changelog } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import {
  answerCallback,
  resolveReviewMessage,
  sendOwnerMessage,
  shortRef,
} from '@/lib/telegram';

export const dynamic = 'force-dynamic';

type Kind = 'tip' | 'correction';

const OUTCOME_TEXT: Record<'approved' | 'denied', string> = {
  approved: '\u2705 Approved',
  denied: '\u274C Denied',
};

interface TelegramUpdate {
  update_id?: number;
  callback_query?: {
    id: string;
    from: { id: number };
    message?: { chat: { id: number }; message_id: number; text?: string };
    data?: string;
  };
  message?: {
    chat: { id: number };
    text?: string;
    from?: { id: number };
  };
}

async function findItem(kind: Kind, id: string) {
  if (kind === 'tip') {
    const [row] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1);
    if (!row) return null;
    return {
      title: [row.city, row.state].filter(Boolean).join(', ') || 'Untitled tip',
      summary: row.observation || row.locationDescription || '(no details)',
      sourceUrl: row.sourceUrl,
      contactEmail: row.contactEmail,
    };
  }
  const [row] = await db
    .select()
    .from(corrections)
    .where(eq(corrections.id, id))
    .limit(1);
  if (!row) return null;
  return {
    title: row.entityName,
    summary: row.description,
    sourceUrl: null,
    contactEmail: row.contactEmail,
  };
}

async function applyDecision(kind: Kind, id: string, approve: boolean) {
  const table = kind === 'tip' ? submissions : corrections;
  const status = approve ? 'accepted' : 'rejected';
  const [row] = await db
    .update(table)
    .set({ status, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(table.id, id))
    .returning({ id: table.id });

  if (!row) return null;

  if (approve) {
    const item = await findItem(kind, id);
    await db.insert(changelog).values({
      entityName: item?.title ?? 'Community submission',
      action: kind === 'tip' ? 'created' : 'corrected',
      description:
        kind === 'tip'
          ? `Community tip approved and published (${shortRef(kind, id)}).`
          : `Correction approved and applied (${shortRef(kind, id)}).`,
      sourceUrl: item?.sourceUrl ?? null,
    });
  }
  return row;
}

async function handleCallback(cq: NonNullable<TelegramUpdate['callback_query']>) {
  const owner = process.env.TELEGRAM_CHAT_ID;
  if (owner && String(cq.from.id) !== String(owner)) {
    console.warn('[telegram] callback from unknown user, ignored:', cq.from.id);
    await answerCallback(cq.id, 'Unknown sender');
    return;
  }
  const match = /^(approve|deny):(tip|correction):([0-9a-f-]+)$/.exec(cq.data ?? '');
  if (!match) {
    await answerCallback(cq.id, 'Unrecognized action');
    return;
  }
  const [, action, rawKind, id] = match;
  const kind: Kind = rawKind === 'correction' ? 'correction' : 'tip';
  const approve = action === 'approve';

  await answerCallback(cq.id, approve ? 'Approving\u2026' : 'Denying\u2026');

  const result = await applyDecision(kind, id, approve);
  const label = OUTCOME_TEXT[approve ? 'approved' : 'denied'];
  const item = await findItem(kind, id);

  if (cq.message) {
    await resolveReviewMessage(
      cq.message.chat.id,
      cq.message.message_id,
      `${label} ${shortRef(kind, id)}\n\u{1F3E2} ${item?.title ?? '(not found)'}`,
    );
  }
  if (!result) {
    await sendOwnerMessage(`\u26A0\uFE0F ${label} failed: ${shortRef(kind, id)} not found in DB`);
  }
}

async function handleMessage(msg: NonNullable<TelegramUpdate['message']>) {
  const owner = process.env.TELEGRAM_CHAT_ID;
  if (owner && String(msg.chat.id) !== String(owner)) return;

  const text = (msg.text ?? '').trim();
  const [cmd, kind, id] = text.split(/\s+/);

  if (cmd === '/start' || cmd === '/help') {
    await sendOwnerMessage(
      'FlockRadar review bot.\n\n' +
        'New tips and corrections are posted here with Approve/Deny buttons.\n' +
        'Manual commands:\n' +
        '/status \u2014 pending counts\n' +
        '/approve <tip|correction> <id>\n' +
        '/deny <tip|correction> <id>',
    );
    return;
  }
  if (cmd === '/status') {
    const [{ n: tipCount }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(submissions)
      .where(eq(submissions.status, 'pending'));
    const [{ n: corCount }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(corrections)
      .where(eq(corrections.status, 'pending'));
    await sendOwnerMessage(
      `Pending review:\n\u{1F9ED} tips: ${tipCount}\n\u270F\uFE0F corrections: ${corCount}`,
    );
    return;
  }
  if ((cmd === '/approve' || cmd === '/deny') && kind && id) {
    const approve = cmd === '/approve';
    const result = await applyDecision(kind as Kind, id, approve);
    await sendOwnerMessage(
      result
        ? `${OUTCOME_TEXT[approve ? 'approved' : 'denied']} ${shortRef(kind as Kind, id)}`
        : `\u26A0\uFE0F Not found: ${kind} ${id}`,
    );
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 403 });
  }
  if (request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'bad secret token' }, { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }
  } catch (err) {
    console.error('[telegram] handler error:', err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ ok: true });
}
