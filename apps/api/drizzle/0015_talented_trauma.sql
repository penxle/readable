CREATE TABLE IF NOT EXISTS "site_widgets" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"out_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_widgets_site_id_unique" UNIQUE("site_id")
);

DO $$ BEGIN
 ALTER TABLE "site_widgets" ADD CONSTRAINT "site_widgets_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
