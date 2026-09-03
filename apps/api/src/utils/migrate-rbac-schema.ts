import { sql } from "drizzle-orm";
import db from "../database";

/**
 * Idempotent repair for RBAC (0030/0031) schema drift. Fork instances that
 * applied their own migration before upstream RBAC migrations were renumbered
 * can end up with a journal/hash mismatch where Drizzle skips pending SQL even
 * though required columns are still missing.
 */
export async function migrateRbacSchema() {
  console.log("🔄 Checking RBAC schema...");

  try {
    await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "workspace_role" (
				"id" text PRIMARY KEY NOT NULL,
				"workspace_id" text NOT NULL,
				"role" text NOT NULL,
				"permission" text NOT NULL,
				"created_at" timestamp DEFAULT now() NOT NULL,
				"updated_at" timestamp DEFAULT now() NOT NULL
			);
		`);

    await db.execute(sql`
			DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1
					FROM pg_constraint
					WHERE conname = 'workspace_role_workspace_id_workspace_id_fk'
				) THEN
					ALTER TABLE "workspace_role"
					ADD CONSTRAINT "workspace_role_workspace_id_workspace_id_fk"
					FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id")
					ON DELETE cascade ON UPDATE cascade;
				END IF;
			END $$;
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "workspace_role_workspaceId_idx"
			ON "workspace_role" USING btree ("workspace_id");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "workspace_role_role_idx"
			ON "workspace_role" USING btree ("role");
		`);

    await db.execute(sql`
			ALTER TABLE "session"
			ADD COLUMN IF NOT EXISTS "impersonated_by" text;
		`);

    await db.execute(sql`
			ALTER TABLE "user"
			ADD COLUMN IF NOT EXISTS "role" text,
			ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false,
			ADD COLUMN IF NOT EXISTS "ban_reason" text,
			ADD COLUMN IF NOT EXISTS "ban_expires" timestamp;
		`);

    console.log("✅ RBAC schema check complete");
  } catch (error) {
    console.error("❌ RBAC schema repair failed:", error);
    throw error;
  }
}
