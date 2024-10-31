ALTER TABLE "page_content_chunks" ALTER COLUMN "vector" SET DATA TYPE vector(1024);--> statement-breakpoint
ALTER TABLE "page_content_chunks" DROP COLUMN IF EXISTS "hash";