import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { invalidateUserAvatarConsumers } from "./use-user-avatar";

describe("invalidateUserAvatarConsumers", () => {
  it("invalidates every query family that can render user avatars", () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    invalidateUserAvatarConsumers(queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["session"] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["workspace", "full"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["workspace-users"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["active-workspace-users"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["tasks"] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["workspace-activities"],
    });
  });
});
