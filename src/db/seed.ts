import fs from 'node:fs';
import path from 'node:path';
import { eq, and } from 'drizzle-orm';
import { db } from './index';
import {
  entities,
  deployments,
  locations,
  sources,
  claims,
} from './schema';
import { logChange } from '../lib/changelog';

interface SeedEntity {
  entity_name: string;
  entity_type: 'city' | 'county' | 'police_department' | 'sheriff' | 'school_district' | 'hoa' | 'transit_agency' | 'other';
  city: string | null;
  county: string | null;
  state: string;
  official_website: string | null;
  program_status: 'active' | 'approved_pending' | 'proposed' | 'removed' | 'unknown';
  vendor: string;
  deployment_status:
    | 'confirmed_active'
    | 'confirmed_approved_pending'
    | 'proposed'
    | 'previously_deployed_removed'
    | 'under_review';
  latitude: number;
  longitude: number;
  facing_direction?: number | null;
  camera_count: number | null;
  contract_value: string | null;
  retention_period: string | null;
  announcement_date: string | null;
  approval_date: string | null;
  source_url: string;
  source_type: 'contract' | 'agenda' | 'minutes' | 'policy' | 'budget' | 'press_release' | 'reporting' | 'records_response' | 'other';
  publisher: string;
  source_title: string;
  published_date: string;
  evidence_excerpt: string;
  notes: string | null;
  confidence?: 'high' | 'medium' | 'low';
  source_strength?: 'primary' | 'secondary' | 'lead_only';
}

async function seedEntity(record: SeedEntity, index: number) {
  const verifiedDate = new Date().toISOString().slice(0, 10);


  let isNew = true;
  const existing = await db
    .select({ id: entities.id })
    .from(entities)
    .where(and(eq(entities.name, record.entity_name), eq(entities.state, record.state)))
    .limit(1);
  if (existing.length > 0) {
    const entityId = existing[0].id;
    const depRows = await db
      .select({ id: deployments.id })
      .from(deployments)
      .where(eq(deployments.entityId, entityId));
    const depIds = depRows.map((r) => r.id);

    if (depIds.length > 0) {

      for (const depId of depIds) {
        const claimRows = await db
          .select({ id: claims.id, sourceId: claims.sourceId })
          .from(claims)
          .where(eq(claims.subjectId, depId));
        for (const c of claimRows) {
          await db.delete(claims).where(eq(claims.id, c.id));
          await db.delete(sources).where(eq(sources.id, c.sourceId));
        }
        await db.delete(locations).where(eq(locations.deploymentId, depId));
        await db.delete(deployments).where(eq(deployments.id, depId));
      }
    }
    await db.delete(entities).where(eq(entities.id, entityId));
    isNew = false;
    console.log(`  (replacing existing record for ${record.entity_name})`);
  }


  const [entity] = await db
    .insert(entities)
    .values({
      name: record.entity_name,
      entityType: record.entity_type,
      city: record.city,
      county: record.county,
      state: record.state,
      officialWebsite: record.official_website,
      programStatus: record.program_status,
      vendor: record.vendor,
      lastVerifiedAt: verifiedDate,
    })
    .returning({ id: entities.id });


  const [deployment] = await db
    .insert(deployments)
    .values({
      entityId: entity.id,
      systemType: 'alpr',
      status: record.deployment_status,
      announcementDate: record.announcement_date,
      approvalDate: record.approval_date,
      cameraCount: record.camera_count,
      contractValue: record.contract_value,
      retentionPeriod: record.retention_period,
      notes: record.notes,
      lastVerifiedAt: verifiedDate,
    })
    .returning({ id: deployments.id });


  await db
    .insert(locations)
    .values({
      deploymentId: deployment.id,
      latitude: record.latitude,
      longitude: record.longitude,
      precisionLevel: 'jurisdiction',
      locationStatus: 'entity_level_only',
      facingDirection: record.facing_direction ?? null,
      description: `Entity-level deployment marker for ${record.entity_name}. Represents the jurisdiction, not a specific camera location.`,
      publicVisible: true,
      lastVerifiedAt: verifiedDate,
    })
    .returning({ id: locations.id });


  const [source] = await db
    .insert(sources)
    .values({
      url: record.source_url,
      sourceType: record.source_type,
      publisher: record.publisher,
      title: record.source_title,
      publishedDate: record.published_date,
      accessedDate: verifiedDate,
      evidenceExcerpt: record.evidence_excerpt,
      sourceStrength: record.source_strength ?? 'primary',
    })
    .returning({ id: sources.id });


  await db.insert(claims).values({
    subjectType: 'deployment',
    subjectId: deployment.id,
    claimType: 'active_status',
    claimValue: record.deployment_status,
    sourceId: source.id,
    confidence: record.confidence ?? 'high',
    reviewStatus: 'verified',
  });


  if (isNew) {
    await logChange(
      record.entity_name,
      'created',
      `Added ${record.entity_name} with primary source "${record.source_title}".`,
      record.source_url,
    );
  }

  console.log(`[${index + 1}] ${record.entity_name} (${record.state}) · ${record.deployment_status}`);
}

async function seed() {
  const dataPath = path.join(process.cwd(), 'src', 'db', 'seed-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`Seed data file not found: ${dataPath}`);
    console.error('Create src/db/seed-data.json with a JSON array of entity records.');
    process.exit(1);
  }

  const records: SeedEntity[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Seeding ${records.length} records...\n`);

  for (let i = 0; i < records.length; i++) {
    await seedEntity(records[i], i);
  }

  console.log('\nSeed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
