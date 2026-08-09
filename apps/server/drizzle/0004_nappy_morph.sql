CREATE TABLE "print_job" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"printer_id" text NOT NULL,
	"printer_agent_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"payload_base64" text NOT NULL,
	"payload_byte_length" integer NOT NULL,
	"idempotency_key" text,
	"lease_expires_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"leased_at" timestamp with time zone,
	"printing_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "printer" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"printer_agent_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"connection_hints_json" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "print_job" ADD CONSTRAINT "print_job_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_job" ADD CONSTRAINT "print_job_printer_id_printer_id_fk" FOREIGN KEY ("printer_id") REFERENCES "public"."printer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_job" ADD CONSTRAINT "print_job_printer_agent_id_printer_agent_id_fk" FOREIGN KEY ("printer_agent_id") REFERENCES "public"."printer_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer" ADD CONSTRAINT "printer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer" ADD CONSTRAINT "printer_printer_agent_id_printer_agent_id_fk" FOREIGN KEY ("printer_agent_id") REFERENCES "public"."printer_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "print_job_org_idempotency_uidx" ON "print_job" USING btree ("organization_id","idempotency_key");--> statement-breakpoint
DROP TABLE IF EXISTS "printer_stub";
