import { eq } from "drizzle-orm";
import db from "../../database";
import { userTable } from "../../database/schema";
import {
  buildAvatarEtag,
  gravatarUrlForEmail,
} from "../../utils/user-display-image";

export async function getUserAvatarHttpResponse(
  userId: string,
  ifNoneMatch: string | undefined,
  ifModifiedSince: string | undefined,
): Promise<Response> {
  const [row] = await db
    .select({
      blob: userTable.avatarBlob,
      mime: userTable.avatarMimeType,
      email: userTable.email,
      image: userTable.image,
      avatarUpdatedAt: userTable.avatarUpdatedAt,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!row) {
    return new Response(null, { status: 404 });
  }

  const blob = row.blob;
  const mime = row.mime;
  const updatedAt = row.avatarUpdatedAt;

  if (blob && mime && updatedAt) {
    const etag = buildAvatarEtag(blob, updatedAt);
    const lastModified = updatedAt.toUTCString();

    if (ifNoneMatch) {
      const tags = ifNoneMatch.split(",").map((t) => t.trim());
      if (tags.includes(etag) || tags.includes(`W/${etag}`)) {
        return new Response(null, {
          status: 304,
          headers: {
            ETag: etag,
            "Cache-Control":
              "public, max-age=86400, stale-while-revalidate=604800",
            "Last-Modified": lastModified,
          },
        });
      }
    }

    if (ifModifiedSince) {
      const ims = Date.parse(ifModifiedSince);
      if (!Number.isNaN(ims) && updatedAt.getTime() <= ims) {
        return new Response(null, {
          status: 304,
          headers: {
            ETag: etag,
            "Cache-Control":
              "public, max-age=86400, stale-while-revalidate=604800",
            "Last-Modified": lastModified,
          },
        });
      }
    }

    return new Response(new Uint8Array(blob), {
      status: 200,
      headers: {
        "Content-Type": mime,
        ETag: etag,
        "Last-Modified": lastModified,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  const fallback = row.image?.trim() || gravatarUrlForEmail(row.email);
  return Response.redirect(fallback, 302);
}
