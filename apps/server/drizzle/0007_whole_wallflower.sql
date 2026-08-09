CREATE TABLE "printer_group" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"printer_agent_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "printer_group_member" (
	"id" text PRIMARY KEY NOT NULL,
	"printer_group_id" text NOT NULL,
	"printer_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "print_job" ALTER COLUMN "printer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "print_job" ADD COLUMN "printer_group_id" text;--> statement-breakpoint
ALTER TABLE "print_job" ADD COLUMN "parent_job_id" text;--> statement-breakpoint
ALTER TABLE "print_job" ADD COLUMN "kind" text DEFAULT 'single' NOT NULL;--> statement-breakpoint
ALTER TABLE "printer_group" ADD CONSTRAINT "printer_group_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer_group" ADD CONSTRAINT "printer_group_printer_agent_id_printer_agent_id_fk" FOREIGN KEY ("printer_agent_id") REFERENCES "public"."printer_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer_group_member" ADD CONSTRAINT "printer_group_member_printer_group_id_printer_group_id_fk" FOREIGN KEY ("printer_group_id") REFERENCES "public"."printer_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer_group_member" ADD CONSTRAINT "printer_group_member_printer_id_printer_id_fk" FOREIGN KEY ("printer_id") REFERENCES "public"."printer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "printer_group_member_uidx" ON "printer_group_member" USING btree ("printer_group_id","printer_id");--> statement-breakpoint
ALTER TABLE "print_job" ADD CONSTRAINT "print_job_printer_group_id_printer_group_id_fk" FOREIGN KEY ("printer_group_id") REFERENCES "public"."printer_group"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_job" ADD CONSTRAINT "print_job_parent_job_id_print_job_id_fk" FOREIGN KEY ("parent_job_id") REFERENCES "public"."print_job"("id") ON DELETE cascade ON UPDATE no action;