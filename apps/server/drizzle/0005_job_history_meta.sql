ALTER TABLE "print_job" ADD COLUMN "kind" text DEFAULT 'raw' NOT NULL;--> statement-breakpoint
ALTER TABLE "print_job" ADD COLUMN "parent_job_id" text;