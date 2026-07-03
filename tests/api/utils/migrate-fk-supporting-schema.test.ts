import { describe, expect, it, vi } from "vitest";

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}));

vi.mock("../../../apps/api/src/database", () => ({
  default: {
    execute: executeMock,
  },
}));

import { migrateFkSupportingSchema } from "../../../apps/api/src/utils/migrate-fk-supporting-schema";

describe("migrate-fk-supporting-schema", () => {
  it("runs idempotent schema repair statements", async () => {
    executeMock.mockResolvedValue({ rows: [] });

    await expect(migrateFkSupportingSchema()).resolves.toBeUndefined();

    expect(executeMock).toHaveBeenCalledTimes(13);
  });
});
