ALTER TABLE "leads" ALTER COLUMN "url" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "processed_at" timestamp;