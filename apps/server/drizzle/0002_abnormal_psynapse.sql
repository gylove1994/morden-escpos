CREATE TABLE "printer_agent" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"device_token_hash" text,
	"device_token_prefix" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_authenticated_at" timestamp with time zone,
	CONSTRAINT "printer_agent_device_token_hash_unique" UNIQUE("device_token_hash")
);
--> statement-breakpoint
ALTER TABLE "printer_agent" ADD CONSTRAINT "printer_agent_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;