CREATE TYPE "public"."claim_type" AS ENUM('vendor', 'active_status', 'camera_count', 'retention_period', 'sharing', 'contract_value', 'location', 'other');--> statement-breakpoint
CREATE TYPE "public"."confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."deployment_status" AS ENUM('confirmed_active', 'confirmed_approved_pending', 'proposed', 'previously_deployed_removed', 'no_public_disclosure', 'under_review');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('city', 'county', 'police_department', 'sheriff', 'school_district', 'hoa', 'transit_agency', 'other');--> statement-breakpoint
CREATE TYPE "public"."location_status" AS ENUM('officially_disclosed', 'verified_submission', 'entity_level_only');--> statement-breakpoint
CREATE TYPE "public"."precision_level" AS ENUM('exact', 'intersection', 'neighborhood', 'jurisdiction');--> statement-breakpoint
CREATE TYPE "public"."program_status" AS ENUM('active', 'approved_pending', 'proposed', 'removed', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('draft', 'verified', 'published', 'disputed', 'removed');--> statement-breakpoint
CREATE TYPE "public"."source_strength" AS ENUM('primary', 'secondary', 'lead_only');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('contract', 'agenda', 'minutes', 'policy', 'budget', 'press_release', 'reporting', 'records_response', 'other');--> statement-breakpoint
CREATE TYPE "public"."system_type" AS ENUM('alpr', 'camera_network', 'unknown');--> statement-breakpoint
CREATE TABLE "changelog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" varchar(20) NOT NULL,
	"subject_id" uuid NOT NULL,
	"claim_type" "claim_type" NOT NULL,
	"claim_value" text NOT NULL,
	"source_id" uuid NOT NULL,
	"confidence" "confidence" DEFAULT 'medium' NOT NULL,
	"review_status" "review_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"system_type" "system_type" DEFAULT 'unknown' NOT NULL,
	"status" "deployment_status" DEFAULT 'under_review' NOT NULL,
	"announcement_date" date,
	"approval_date" date,
	"operational_date" date,
	"end_date" date,
	"camera_count" integer,
	"contract_value" numeric(12, 2),
	"retention_period" varchar(100),
	"sharing_notes" text,
	"policy_url" varchar(1000),
	"notes" text,
	"last_verified_at" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"city" varchar(100),
	"county" varchar(100),
	"state" varchar(2) NOT NULL,
	"official_website" varchar(500),
	"program_status" "program_status" DEFAULT 'unknown' NOT NULL,
	"vendor" varchar(100) DEFAULT 'unknown',
	"last_verified_at" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deployment_id" uuid NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"precision_level" "precision_level" DEFAULT 'jurisdiction' NOT NULL,
	"location_status" "location_status" DEFAULT 'entity_level_only' NOT NULL,
	"location_description" text,
	"public_visible" boolean DEFAULT true NOT NULL,
	"last_verified_at" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" varchar(2000) NOT NULL,
	"source_type" "source_type" NOT NULL,
	"publisher" varchar(255),
	"title" varchar(500),
	"published_date" date,
	"accessed_date" date DEFAULT now() NOT NULL,
	"evidence_excerpt" text,
	"archive_url" varchar(2000),
	"source_strength" "source_strength" DEFAULT 'secondary' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"location_description" text,
	"city" varchar(100),
	"county" varchar(100),
	"state" varchar(2) NOT NULL,
	"observation" text,
	"evidence_type" varchar(50),
	"source_url" varchar(2000),
	"observed_date" date,
	"contact_email" varchar(255),
	"right_to_share_confirmed" boolean DEFAULT false NOT NULL,
	"reviewer_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_deployment_id_deployments_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."deployments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claims_subject_idx" ON "claims" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "claims_source_idx" ON "claims" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "deployments_entity_idx" ON "deployments" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "deployments_status_idx" ON "deployments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "entities_state_idx" ON "entities" USING btree ("state");--> statement-breakpoint
CREATE INDEX "entities_entity_type_idx" ON "entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "locations_deployment_idx" ON "locations" USING btree ("deployment_id");