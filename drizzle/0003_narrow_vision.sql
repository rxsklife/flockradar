CREATE TABLE "corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"contact_email" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewer_notes" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "reviewed_at" timestamp;