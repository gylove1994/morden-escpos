ALTER TABLE "print_job" ADD COLUMN "purpose" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "print_job" ADD COLUMN "template_id" text;--> statement-breakpoint
ALTER TABLE "print_job" ADD CONSTRAINT "print_job_template_id_print_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."print_template"("id") ON DELETE set null ON UPDATE no action;
