import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// DATABASE_URL이 없으면 에러를 던지지 않고, storage.ts에서 InMemoryStorage를 사용
if (!process.env.DATABASE_URL) {
  // storage.ts에서 InMemoryStorage를 사용하므로 여기서는 에러를 던지지 않음
  // 대신 더미 객체를 export (실제로는 사용되지 않음)
  export const pool = null as any;
  export const db = null as any;
} else {
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzle(pool, { schema });
}
