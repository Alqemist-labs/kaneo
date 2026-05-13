import { describe, expect, it } from "vitest";
import { MAX_AVATAR_BYTES } from "../../apps/api/src/user/controllers/detect-image-mime";
import {
  gravatarUrlForEmail,
  resolveUserDisplayImageUrl,
} from "../../apps/api/src/utils/user-display-image";

describe("avatar upload limits", () => {
  it("accepts avatars up to 5 MB", () => {
    expect(MAX_AVATAR_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe("resolveUserDisplayImageUrl", () => {
  it("prefers uploaded avatar URL when avatarUpdatedAt is set", () => {
    process.env.KANEO_API_URL = "http://localhost:1337";
    const url = resolveUserDisplayImageUrl({
      id: "usr_1",
      email: "a@b.com",
      image: "https://example.com/old.png",
      avatarUpdatedAt: new Date("2020-01-01"),
    });
    expect(url).toBe(
      `http://localhost:1337/api/user/avatar/usr_1?v=${new Date("2020-01-01").getTime()}`,
    );
  });

  it("changes uploaded avatar URL when avatarUpdatedAt changes", () => {
    process.env.KANEO_API_URL = "http://localhost:1337";
    const firstUrl = resolveUserDisplayImageUrl({
      id: "usr_1",
      email: "a@b.com",
      image: null,
      avatarUpdatedAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    const secondUrl = resolveUserDisplayImageUrl({
      id: "usr_1",
      email: "a@b.com",
      image: null,
      avatarUpdatedAt: new Date("2020-01-02T00:00:00.000Z"),
    });

    expect(secondUrl).not.toBe(firstUrl);
  });

  it("uses external image when no upload", () => {
    const url = resolveUserDisplayImageUrl({
      id: "usr_1",
      email: "a@b.com",
      image: "https://github.com/avatar.png",
      avatarUpdatedAt: null,
    });
    expect(url).toBe("https://github.com/avatar.png");
  });

  it("falls back to Gravatar", () => {
    const url = resolveUserDisplayImageUrl({
      id: "usr_1",
      email: "Test@Example.com",
      image: null,
      avatarUpdatedAt: null,
    });
    expect(url).toBe(gravatarUrlForEmail("Test@Example.com"));
  });
});
