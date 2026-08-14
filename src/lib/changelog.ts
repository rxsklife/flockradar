import { db } from '@/db';
import { changelog } from '@/db/schema';

export async function logChange(
  entityName: string,
  action: string,
  description: string,
  sourceUrl?: string | null,
) {
  await db.insert(changelog).values({ entityName, action, description, sourceUrl });
}
