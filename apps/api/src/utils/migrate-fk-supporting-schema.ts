import { sql } from "drizzle-orm";
import db from "../database";

/**
 * Idempotent repair for migration 0029_fk_supporting_indexes schema drift.
 * Fork instances can have the Drizzle journal entry without the actual
 * columns/indexes when migrations were renumbered before upstream RBAC.
 */
export async function migrateFkSupportingSchema() {
  console.log("🔄 Checking FK supporting schema...");

  try {
    await db.execute(sql`
			ALTER TABLE "notification"
			ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
		`);

    await db.execute(sql`
			ALTER TABLE "time_entry"
			ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "activity_userId_idx"
			ON "activity" USING btree ("user_id");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "asset_createdBy_idx"
			ON "asset" USING btree ("created_by");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "invitation_inviterId_idx"
			ON "invitation" USING btree ("inviter_id");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "notification_userId_idx"
			ON "notification" USING btree ("user_id");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "task_assigneeId_idx"
			ON "task" USING btree ("assignee_id");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "task_columnId_idx"
			ON "task" USING btree ("column_id");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "time_entry_taskId_idx"
			ON "time_entry" USING btree ("task_id");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "time_entry_userId_idx"
			ON "time_entry" USING btree ("user_id");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "user_notification_workspace_project_workspaceId_projectId_idx"
			ON "user_notification_workspace_project" USING btree ("workspace_id", "project_id");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "unwp_workspaceId_workspaceRuleId_idx"
			ON "user_notification_workspace_project" USING btree ("workspace_id", "workspace_rule_id");
		`);

    await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "workflow_rule_columnId_idx"
			ON "workflow_rule" USING btree ("column_id");
		`);

    console.log("✅ FK supporting schema check complete");
  } catch (error) {
    console.error("❌ FK supporting schema repair failed:", error);
    throw error;
  }
}
