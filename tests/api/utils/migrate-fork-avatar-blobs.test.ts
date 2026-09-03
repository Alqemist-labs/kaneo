import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}));

vi.mock("../../../apps/api/src/database", () => ({
  default: {
    execute: executeMock,
  },
}));

import { migrateForkAvatarBlobs } from "../../../apps/api/src/utils/migrate-fork-avatar-blobs";

describe("migrate-fork-avatar-blobs", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("does nothing when the fork column is already gone", async () => {
    executeMock.mockResolvedValue({ rows: [] });

    await expect(migrateForkAvatarBlobs()).resolves.toBeUndefined();

    // Only the column probe runs.
    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  it("copies, repoints and drops when the fork column is present", async () => {
    executeMock
      .mockResolvedValueOnce({ rows: [{ column_name: "avatar_blob" }] })
      .mockResolvedValue({ rows: [] });

    await expect(migrateForkAvatarBlobs()).resolves.toBeUndefined();

    // Probe + insert + update + drop.
    expect(executeMock).toHaveBeenCalledTimes(4);
  });

  it("propagates a failure instead of leaving the copy half done", async () => {
    executeMock
      .mockResolvedValueOnce({ rows: [{ column_name: "avatar_blob" }] })
      .mockRejectedValueOnce(new Error("boom"));

    await expect(migrateForkAvatarBlobs()).rejects.toThrow("boom");
  });
});
