

export interface ReviewItem {
  kind: 'tip' | 'correction';
  id: string;
  title: string;
  summary: string;
  contactEmail: string | null;
  sourceUrl: string | null;
  submittedAt: string;
}

export function telegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

async function tgFetch(method: string, payload: Record<string, unknown>): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),

      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.error(`[telegram] ${method} failed:`, res.status, (await res.text()).slice(0, 300));
      return false;
    }
    const json = (await res.json()) as { ok: boolean };
    return json.ok === true;
  } catch (err) {
    console.error('[telegram] request error:', err instanceof Error ? err.message : err);
    return false;
  }
}

export function shortRef(kind: ReviewItem['kind'], id: string): string {
  return `${kind === 'tip' ? 'TIP' : 'COR'}-${id.slice(0, 4).toUpperCase()}`;
}

export function buildReviewPrompt(item: ReviewItem): string {
  const ref = shortRef(item.kind, item.id);
  const lines = [
    item.kind === 'tip'
      ? `\u{1F9ED} NEW TIP ${ref}`
      : `\u270F\uFE0F NEW CORRECTION ${ref}`,
    `\u{1F3E2} ${item.title}`,
    `\u{1F4DD} ${item.summary.slice(0, 280)}`,
  ];
  if (item.contactEmail) lines.push(`\u{1F4E7} ${item.contactEmail}`);
  if (item.sourceUrl) lines.push(`\u{1F517} ${item.sourceUrl}`);
  lines.push(`\u{23F0} ${item.submittedAt}`);
  return lines.join('\n');
}

export async function sendReviewPrompt(item: ReviewItem): Promise<boolean> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!telegramEnabled() || !chatId) return false;
  return tgFetch('sendMessage', {
    chat_id: chatId,
    text: buildReviewPrompt(item),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '\u2705 Approve', callback_data: `approve:${item.kind}:${item.id}` },
          { text: '\u274C Deny', callback_data: `deny:${item.kind}:${item.id}` },
        ],
      ],
    },
  });
}

export async function resolveReviewMessage(
  chatId: string | number,
  messageId: number,
  text: string,
): Promise<boolean> {
  return tgFetch('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [] },
  });
}

export async function answerCallback(callbackQueryId: string, text?: string): Promise<boolean> {
  return tgFetch('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

export async function sendOwnerMessage(text: string): Promise<boolean> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!telegramEnabled() || !chatId) return false;
  return tgFetch('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}
