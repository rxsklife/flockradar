

export interface ReviewItem {
  kind: 'tip' | 'correction' | 'lead' | 'abuse' | 'camera';
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
  const prefix =
    kind === 'tip' ? 'TIP' : kind === 'correction' ? 'COR' : kind === 'lead' ? 'LEAD' : kind === 'camera' ? 'CAM' : 'ABU';
  return `${prefix}-${id.slice(0, 4).toUpperCase()}`;
}

export function buildReviewPrompt(item: ReviewItem): string {
  const ref = shortRef(item.kind, item.id);
  const lines = [
    item.kind === 'tip'
      ? `\u{1F9ED} NEW TIP ${ref}`
      : item.kind === 'correction'
        ? `\u270F\uFE0F NEW CORRECTION ${ref}`
        : item.kind === 'lead'
          ? `\u{1F50D} NEW LEAD ${ref}`
          : `\u26A0\uFE0F NEW ABUSE CASE ${ref}`,
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

export async function sendCameraReport(report: {
  id: string;
  lat: number;
  lng: number;
  photo: string | null;
  notes: string | null;
}): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const ref = `ABU-${report.id.slice(0, 4).toUpperCase()}`;
  const caption = [
    `📸 NEW CAMERA REPORT ${ref}`,
    `📍 ${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`,
    report.notes ? `📝 ${report.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  const keyboard = {
    inline_keyboard: [
      [
        { text: '\u2705 Approve', callback_data: `approve:camera:${report.id}` },
        { text: '\u274C Deny', callback_data: `deny:camera:${report.id}` },
      ],
    ],
  };
  try {
    if (report.photo) {
      const base64 = report.photo.split(',')[1] ?? report.photo;
      const mime = report.photo.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const fd = new FormData();
      fd.append('chat_id', String(chatId));
      fd.append('photo', new Blob([bytes], { type: mime }), 'camera-report.jpg');
      fd.append('caption', caption);
      fd.append('reply_markup', JSON.stringify(keyboard));
      const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        body: fd,
        signal: AbortSignal.timeout(15000),
      });
      const json = (await res.json()) as { ok?: boolean };
      return json.ok === true;
    }
    return tgFetch('sendMessage', {
      chat_id: chatId,
      text: caption,
      disable_web_page_preview: true,
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error('[telegram] camera report failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
