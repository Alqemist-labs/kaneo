ALTER TABLE "user" ADD COLUMN "avatar_blob" "bytea";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "avatar_mime_type" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "avatar_updated_at" timestamp;