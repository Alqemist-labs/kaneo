import { sql } from "drizzle-orm";
import db from "../database";

/**
 * One-shot migration of the fork's own avatar storage onto upstream's.
 *
 * The Alqemist fork stored profile images in `user.avatar_blob` and served
 * them from `/api/user/avatar/{userId}`. Upstream v2.10+ stores them in the
 * `user_avatar` table and keeps the URL in `user.image`. This copies whatever
 * the fork wrote into the upstream table, repoints `user.image` at it, and
 * drops the fork columns so it cannot run twice.
 */
export async function migrateForkAvatarBlobs() {
  const columns = await db.execute<{ column_name: string }>(sql`
		SELECT column_name
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'user'
			AND column_name = 'avatar_blob';
	`);

  if (columns.rows.length === 0) {
    return;
  }

  console.log("🔄 Migrating fork avatars to the user_avatar table...");

  try {
    await db.execute(sql`
			INSERT INTO "user_avatar" (
				"id", "user_id", "mime_type", "size", "data", "created_at", "updated_at"
			)
			SELECT
				md5(random()::text || clock_timestamp()::text || "id"),
				"id",
				"avatar_mime_type",
				octet_length("avatar_blob"),
				"avatar_blob",
				COALESCE("avatar_updated_at", now()),
				COALESCE("avatar_updated_at", now())
			FROM "user"
			WHERE "avatar_blob" IS NOT NULL
				AND "avatar_mime_type" IS NOT NULL
			ON CONFLICT ("user_id") DO NOTHING;
		`);

    await db.execute(sql`
			UPDATE "user" AS u
			SET "image" = '/api/user/avatar/' || a."id"
			FROM "user_avatar" AS a
			WHERE a."user_id" = u."id"
				AND u."avatar_blob" IS NOT NULL;
		`);

    await db.execute(sql`
			ALTER TABLE "user"
			DROP COLUMN IF EXISTS "avatar_blob",
			DROP COLUMN IF EXISTS "avatar_mime_type",
			DROP COLUMN IF EXISTS "avatar_updated_at";
		`);

    console.log("✅ Fork avatars migrated");
  } catch (error) {
    console.error("❌ Fork avatar migration failed:", error);
    throw error;
  }
}
