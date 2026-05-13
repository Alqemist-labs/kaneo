import { customType } from "drizzle-orm/pg-core";

/** PostgreSQL `bytea` mapped to Node `Buffer`. */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});
