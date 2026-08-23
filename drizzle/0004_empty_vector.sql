CREATE TABLE "abuse_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" varchar(2000) NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"source_name" varchar(255),
	"published_at" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewer_notes" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "abuse_cases_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" varchar(2000) NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"source_name" varchar(255),
	"published_at" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewer_notes" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leads_url_unique" UNIQUE("url")
);
