import { createHash } from "node:crypto";

export type UserDisplayImageInput = {
  email: string;
  image: string | null;
};

export function gravatarUrlForEmail(email: string, size = 256): string {
  const normalized = email.trim().toLowerCase();
  const hash = createHash("md5").update(normalized).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
}

/**
 * Upstream keeps the uploaded avatar's URL in `user.image`; anyone without one
 * falls back to Gravatar rather than to initials.
 */
export function resolveUserDisplayImageUrl(
  input: UserDisplayImageInput,
): string {
  const stored = input.image?.trim();
  if (stored) {
    return stored;
  }
  return gravatarUrlForEmail(input.email);
}
