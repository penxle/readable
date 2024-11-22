CREATE TABLE IF NOT EXISTS "site_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"kind" text NOT NULL,
	"device_id" text,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "site_logs" ADD CONSTRAINT "site_logs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "site_logs_site_id_kind_created_at_index" ON "site_logs" USING btree ("site_id","kind","created_at");
CREATE INDEX IF NOT EXISTS "site_logs_site_id_device_id_created_at_index" ON "site_logs" USING btree ("site_id","device_id","created_at");