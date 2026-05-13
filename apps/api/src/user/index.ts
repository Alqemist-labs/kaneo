import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";
import deleteUserAvatar from "./controllers/delete-user-avatar";
import uploadUserAvatar from "./controllers/upload-user-avatar";

const user = new Hono<{
  Variables: { userId: string };
}>()
  .post(
    "/profile/avatar",
    describeRoute({
      operationId: "uploadUserAvatar",
      tags: ["User"],
      description: "Upload a profile picture (JPEG, PNG or WebP, max 5 MB)",
      responses: {
        200: {
          description: "Avatar URL to use in the client",
          content: {
            "application/json": {
              schema: resolver(
                v.object({
                  image: v.string(),
                }),
              ),
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.get("userId");
      if (!userId) {
        throw new HTTPException(401, { message: "Unauthorized" });
      }

      const body = await c.req.parseBody();
      const file = body.avatar ?? body.file;
      if (!file || typeof file === "string") {
        throw new HTTPException(400, {
          message: "Missing file field (avatar)",
        });
      }

      const result = await uploadUserAvatar(userId, file as File);
      return c.json(result);
    },
  )
  .delete(
    "/profile/avatar",
    describeRoute({
      operationId: "deleteUserAvatar",
      tags: ["User"],
      description: "Remove uploaded profile picture (falls back to Gravatar)",
      responses: {
        204: { description: "Avatar removed" },
      },
    }),
    async (c) => {
      const userId = c.get("userId");
      if (!userId) {
        throw new HTTPException(401, { message: "Unauthorized" });
      }

      await deleteUserAvatar(userId);
      return c.body(null, 204);
    },
  );

export default user;
