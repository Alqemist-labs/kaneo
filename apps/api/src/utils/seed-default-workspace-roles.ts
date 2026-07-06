import { DEFAULT_ROLE_NAMES, defaultRolePayloads } from "@kaneo/permissions";
import { and, eq, inArray, sql } from "drizzle-orm";
import db, { schema } from "../database";

function parsePermissionPayload(raw: string): Record<string, string[]> | null {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    const result: Record<string, string[]> = {};
    for (const [resource, actions] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (!Array.isArray(actions)) continue;
      const filtered = actions.filter(
        (action): action is string => typeof action === "string",
      );
      if (filtered.length > 0) {
        result[resource] = filtered;
      }
    }
    return result;
  } catch {
    return null;
  }
}

function mergeDefaultPermissions(
  current: Record<string, string[]>,
  expected: Record<string, string[]>,
): { merged: Record<string, string[]>; changed: boolean } {
  const merged: Record<string, string[]> = {};
  let changed = false;

  for (const [resource, actions] of Object.entries(current)) {
    merged[resource] = [...actions];
  }

  for (const [resource, actions] of Object.entries(expected)) {
    if (!merged[resource]) {
      merged[resource] = [...actions];
      changed = true;
      continue;
    }

    for (const action of actions) {
      if (!merged[resource].includes(action)) {
        merged[resource].push(action);
        changed = true;
      }
    }
  }

  return { merged, changed };
}

/**
 * Add any newly introduced default permissions to existing default-role rows.
 * Additive only — never removes permissions an admin may have granted.
 */
async function syncDefaultWorkspaceRolePermissions() {
  for (const roleName of DEFAULT_ROLE_NAMES) {
    const expected = defaultRolePayloads[roleName];
    const rows = await db
      .select({
        id: schema.workspaceRoleTable.id,
        permission: schema.workspaceRoleTable.permission,
      })
      .from(schema.workspaceRoleTable)
      .where(eq(schema.workspaceRoleTable.role, roleName));

    for (const row of rows) {
      const current = parsePermissionPayload(row.permission);
      if (!current) continue;

      const { merged, changed } = mergeDefaultPermissions(current, expected);
      if (!changed) continue;

      await db
        .update(schema.workspaceRoleTable)
        .set({
          permission: JSON.stringify(merged),
          updatedAt: new Date(),
        })
        .where(eq(schema.workspaceRoleTable.id, row.id));
    }
  }
}

/**
 * Backfill the editable default roles (viewer/member/admin) for every
 * workspace that's missing them. Runs on API startup after Drizzle
 * migrations.
 *
 * These three roles used to be static (compiled into better-auth's
 * `roles` config). They were converted to DB rows so admins can override
 * them per workspace — but that means existing workspaces, which were
 * created before the switch, have no rows yet. Without this backfill,
 * better-auth's dynamic-access-control resolution would treat them as
 * having an empty permission set on existing workspaces.
 *
 * Idempotent: only inserts rows that aren't already present.
 */
export async function seedDefaultWorkspaceRoles() {
  try {
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'workspace_role'
      ) AS exists;
    `);

    const exists =
      tableExists.rows[0]?.exists === true ||
      tableExists.rows[0]?.exists === "t";
    if (!exists) {
      console.log(
        "🛈 workspace_role table does not exist — skipping default-role seed.",
      );
      return;
    }

    const workspaces = await db
      .select({ id: schema.workspaceTable.id })
      .from(schema.workspaceTable);

    if (workspaces.length === 0) {
      await syncDefaultWorkspaceRolePermissions();
      return;
    }

    const workspaceIds = workspaces.map((w) => w.id);

    const existingRows = await db
      .select({
        workspaceId: schema.workspaceRoleTable.workspaceId,
        role: schema.workspaceRoleTable.role,
      })
      .from(schema.workspaceRoleTable)
      .where(
        and(
          inArray(schema.workspaceRoleTable.workspaceId, workspaceIds),
          inArray(
            schema.workspaceRoleTable.role,
            DEFAULT_ROLE_NAMES as unknown as string[],
          ),
        ),
      );

    const present = new Set(
      existingRows.map((r) => `${r.workspaceId}:${r.role}`),
    );

    const now = new Date();
    const rows: Array<typeof schema.workspaceRoleTable.$inferInsert> = [];
    for (const workspaceId of workspaceIds) {
      for (const name of DEFAULT_ROLE_NAMES) {
        if (present.has(`${workspaceId}:${name}`)) continue;
        rows.push({
          workspaceId,
          role: name,
          permission: JSON.stringify(defaultRolePayloads[name]),
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (rows.length > 0) {
      // Postgres' bind protocol caps parameters at 65535 per query, so insert
      // in chunks. 6 columns × 1000 rows = 6000 params per batch, leaving ample
      // headroom even for instances with tens of thousands of workspaces.
      const BATCH_SIZE = 1000;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        await db
          .insert(schema.workspaceRoleTable)
          .values(rows.slice(i, i + BATCH_SIZE));
      }
      console.log(
        `✅ Seeded ${rows.length} default workspace role row(s) across ${workspaceIds.length} workspace(s).`,
      );
    }

    await syncDefaultWorkspaceRolePermissions();
  } catch (error) {
    console.error("❌ Failed to seed default workspace roles:", error);
    throw error;
  }
}
