import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  integer,
  smallint,
  decimal,
  timestamp,
  pgEnum,
  doublePrecision,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

export const entityTypeEnum = pgEnum('entity_type', [
  'city', 'county', 'police_department', 'sheriff',
  'school_district', 'hoa', 'transit_agency', 'other',
]);

export const programStatusEnum = pgEnum('program_status', [
  'active', 'approved_pending', 'proposed', 'removed', 'unknown',
]);

export const systemTypeEnum = pgEnum('system_type', [
  'alpr', 'camera_network', 'unknown',
]);

export const deploymentStatusEnum = pgEnum('deployment_status', [
  'confirmed_active', 'confirmed_approved_pending', 'proposed',
  'previously_deployed_removed', 'no_public_disclosure', 'under_review',
]);

export const precisionEnum = pgEnum('precision_level', [
  'exact', 'intersection', 'neighborhood', 'jurisdiction',
]);

export const locationStatusEnum = pgEnum('location_status', [
  'officially_disclosed', 'verified_submission', 'entity_level_only',
]);

export const sourceTypeEnum = pgEnum('source_type', [
  'contract', 'agenda', 'minutes', 'policy', 'budget',
  'press_release', 'reporting', 'records_response', 'other',
]);

export const sourceStrengthEnum = pgEnum('source_strength', [
  'primary', 'secondary', 'lead_only',
]);

export const claimTypeEnum = pgEnum('claim_type', [
  'vendor', 'active_status', 'camera_count', 'retention_period',
  'sharing', 'contract_value', 'location', 'other',
]);

export const confidenceEnum = pgEnum('confidence', [
  'high', 'medium', 'low',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'draft', 'verified', 'published', 'disputed', 'removed',
]);

export const entities = pgTable('entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  entityType: entityTypeEnum('entity_type').notNull(),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  state: varchar('state', { length: 2 }).notNull(),
  officialWebsite: varchar('official_website', { length: 500 }),
  programStatus: programStatusEnum('program_status').notNull().default('unknown'),
  vendor: varchar('vendor', { length: 100 }).default('unknown'),
  lastVerifiedAt: date('last_verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('entities_state_idx').on(table.state),
  index('entities_entity_type_idx').on(table.entityType),
]);

export const deployments = pgTable('deployments', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityId: uuid('entity_id').references(() => entities.id).notNull(),
  systemType: systemTypeEnum('system_type').notNull().default('unknown'),
  status: deploymentStatusEnum('status').notNull().default('under_review'),
  announcementDate: date('announcement_date'),
  approvalDate: date('approval_date'),
  operationalDate: date('operational_date'),
  endDate: date('end_date'),
  cameraCount: integer('camera_count'),
  contractValue: decimal('contract_value', { precision: 12, scale: 2 }),
  retentionPeriod: varchar('retention_period', { length: 100 }),
  sharingNotes: text('sharing_notes'),
  policyUrl: varchar('policy_url', { length: 1000 }),
  notes: text('notes'),
  lastVerifiedAt: date('last_verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('deployments_entity_idx').on(table.entityId),
  index('deployments_status_idx').on(table.status),
]);

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  deploymentId: uuid('deployment_id').references(() => deployments.id).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  precisionLevel: precisionEnum('precision_level').notNull().default('jurisdiction'),
  locationStatus: locationStatusEnum('location_status').notNull().default('entity_level_only'),
  facingDirection: smallint('facing_direction'),
  description: text('location_description'),
  publicVisible: boolean('public_visible').notNull().default(true),
  lastVerifiedAt: date('last_verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('locations_deployment_idx').on(table.deploymentId),
]);

export const sources = pgTable('sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: varchar('url', { length: 2000 }).notNull(),
  sourceType: sourceTypeEnum('source_type').notNull(),
  publisher: varchar('publisher', { length: 255 }),
  title: varchar('title', { length: 500 }),
  publishedDate: date('published_date'),
  accessedDate: date('accessed_date').notNull().defaultNow(),
  evidenceExcerpt: text('evidence_excerpt'),
  archiveUrl: varchar('archive_url', { length: 2000 }),
  sourceStrength: sourceStrengthEnum('source_strength').notNull().default('secondary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const claims = pgTable('claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectType: varchar('subject_type', { length: 20 }).notNull(),
  subjectId: uuid('subject_id').notNull(),
  claimType: claimTypeEnum('claim_type').notNull(),
  claimValue: text('claim_value').notNull(),
  sourceId: uuid('source_id').references(() => sources.id).notNull(),
  confidence: confidenceEnum('confidence').notNull().default('medium'),
  reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('claims_subject_idx').on(table.subjectType, table.subjectId),
  index('claims_source_idx').on(table.sourceId),
]);

export const changelog = pgTable('changelog', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityName: varchar('entity_name', { length: 255 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  description: text('description').notNull(),
  sourceUrl: varchar('source_url', { length: 2000 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  locationDescription: text('location_description'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  state: varchar('state', { length: 2 }).notNull(),
  observation: text('observation'),
  evidenceType: varchar('evidence_type', { length: 50 }),
  sourceUrl: varchar('source_url', { length: 2000 }),
  observedDate: date('observed_date'),
  contactEmail: varchar('contact_email', { length: 255 }),
  rightToShareConfirmed: boolean('right_to_share_confirmed').notNull().default(false),
  reviewerNotes: text('reviewer_notes'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const corrections = pgTable('corrections', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityName: varchar('entity_name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  reviewerNotes: text('reviewer_notes'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: varchar('url', { length: 2000 }).notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  sourceName: varchar('source_name', { length: 255 }),
  publishedAt: timestamp('published_at'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  reviewerNotes: text('reviewer_notes'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const abuseCases = pgTable('abuse_cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: varchar('url', { length: 2000 }).notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  sourceName: varchar('source_name', { length: 255 }),
  publishedAt: timestamp('published_at'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  reviewerNotes: text('reviewer_notes'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
