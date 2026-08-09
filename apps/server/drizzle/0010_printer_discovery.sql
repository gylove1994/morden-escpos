CREATE TABLE "printer_discovery" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"printer_agent_id" text NOT NULL,
	"endpoint_key" text NOT NULL,
	"connection_hints_json" text NOT NULL,
	"suggested_name" text,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"confirmed_printer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "printer_discovery" ADD CONSTRAINT "printer_discovery_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer_discovery" ADD CONSTRAINT "printer_discovery_printer_agent_id_printer_agent_id_fk" FOREIGN KEY ("printer_agent_id") REFERENCES "public"."printer_agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer_discovery" ADD CONSTRAINT "printer_discovery_confirmed_printer_id_printer_id_fk" FOREIGN KEY ("confirmed_printer_id") REFERENCES "public"."printer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "printer_discovery_agent_endpoint_uidx" ON "printer_discovery" USING btree ("printer_agent_id","endpoint_key");