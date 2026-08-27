import { NextResponse } from 'next/server';
import { db } from '@/db';
import { cameraReports } from '@/db/schema';
import { sendCameraReport } from '@/lib/telegram';

export async function POST(req: Request) {
  let body: { lat?: unknown; lng?: unknown; photo?: unknown; notes?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ ok: false, error: 'Invalid coordinates.' }, { status: 400 });
  }
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) || null : null;
  const photo = typeof body.photo === 'string' && body.photo.length < 4_000_000 ? body.photo : null;

  const [row] = await db
    .insert(cameraReports)
    .values({ latitude: lat, longitude: lng, notes })
    .returning({ id: cameraReports.id });

  await sendCameraReport({ id: row.id, lat, lng, photo, notes });

  return NextResponse.json({ ok: true, id: row.id });
}
