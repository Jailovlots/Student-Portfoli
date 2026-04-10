import { db } from "../lib/db/src/index.ts";
import { sql } from "drizzle-orm";

async function check() {
  try {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables found:", tables.rows.map((r: any) => r.table_name));
  } catch (error) {
    console.error("Failed to check tables:", error);
  } finally {
    process.exit();
  }
}

check();
