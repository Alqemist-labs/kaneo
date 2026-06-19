import { describe, expect, it, vi } from "vitest";

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}));

vi.mock("../../../apps/api/src/database", () => ({
  default: {
    execute: executeMock,
  },
}));

import { migrateRbacAndAvatarSchema } from "../../../apps/api/src/utils/migrate-rbac-and-avatar-schema";

describe("migrate-rbac-and-avatar-schema", () => {
  it("runs idempotent schema repair statements", async () => {
    executeMock.mockResolvedValue({ rows: [] });

    await expect(migrateRbacAndAvatarSchema()).resolves.toBeUndefined();

    expect(executeMock).toHaveBeenCalledTimes(7);
  });
});
