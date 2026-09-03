import { describe, expect, it } from "vitest";
import {
  gravatarUrlForEmail,
  resolveUserDisplayImageUrl,
} from "../../apps/api/src/utils/user-display-image";

describe("resolveUserDisplayImageUrl", () => {
  it("uses the stored image when there is one", () => {
    const url = resolveUserDisplayImageUrl({
      email: "a@b.com",
      image: "https://github.com/avatar.png",
    });
    expect(url).toBe("https://github.com/avatar.png");
  });

  it("uses the uploaded avatar URL stored by upstream", () => {
    const url = resolveUserDisplayImageUrl({
      email: "a@b.com",
      image: "/api/user/avatar/avt_1",
    });
    expect(url).toBe("/api/user/avatar/avt_1");
  });

  it("falls back to Gravatar when there is no image", () => {
    const url = resolveUserDisplayImageUrl({
      email: "Test@Example.com",
      image: null,
    });
    expect(url).toBe(gravatarUrlForEmail("Test@Example.com"));
  });

  it("ignores a blank image", () => {
    const url = resolveUserDisplayImageUrl({
      email: "Test@Example.com",
      image: "   ",
    });
    expect(url).toBe(gravatarUrlForEmail("Test@Example.com"));
  });

  it("normalises the email before hashing", () => {
    expect(gravatarUrlForEmail(" Test@Example.com ")).toBe(
      gravatarUrlForEmail("test@example.com"),
    );
  });
});
