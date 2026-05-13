import { createHash } from "node:crypto";

export type UserDisplayImageInput = {
  id: string;
  email: string;
  image: string | null;
  avatarUpdatedAt: Date | null;
};

export function getApiPublicBaseUrl(): string {
  return (process.env.KANEO_API_URL || "http://localhost:1337")
    .replace(/\/+$/, "")
    .replace(/\/api\/?$/i, "");
}

/** URL that serves bytes (ETag) when the user has uploaded an avatar. */
export function userUploadedAvatarUrl(
  userId: string,
  avatarUpdatedAt?: Date | null,
): string {
  const baseUrl = `${getApiPublicBaseUrl()}/api/user/avatar/${userId}`;
  return avatarUpdatedAt
    ? `${baseUrl}?v=${avatarUpdatedAt.getTime()}`
    : baseUrl;
}

export function gravatarUrlForEmail(email: string, size = 256): string {
  const normalized = email.trim().toLowerCase();
  const hash = createHash("md5").update(normalized).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
}

export function resolveUserDisplayImageUrl(
  input: UserDisplayImageInput,
): string {
  if (input.avatarUpdatedAt != null) {
    return userUploadedAvatarUrl(input.id, input.avatarUpdatedAt);
  }
  const external = input.image?.trim();
  if (external) {
    return external;
  }
  return gravatarUrlForEmail(input.email);
}

export function buildAvatarEtag(blob: Buffer, updatedAt: Date): string {
  const h = createHash("sha256").update(blob).digest("hex").slice(0, 32);
  return `"${h}-${updatedAt.getTime()}"`;
}
