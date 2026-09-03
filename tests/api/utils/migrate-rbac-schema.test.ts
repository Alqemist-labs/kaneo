import { describe, expect, it, vi } from "vitest";

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}));

vi.mock("../../../apps/api/src/database", () => ({
  default: {
    execute: executeMock,
  },
}));

import { migrateRbacSchema } from "../../../apps/api/src/utils/migrate-rbac-schema";

describe("migrate-rbac-schema", () => {
  it("runs idempotent schema repair statements", async () => {
    executeMock.mockResolvedValue({ rows: [] });

    await expect(migrateRbacSchema()).resolves.toBeUndefined();

    expect(executeMock).toHaveBeenCalledTimes(6);
  });
});
