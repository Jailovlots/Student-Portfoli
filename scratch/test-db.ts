import "dotenv/config";
import { db, usersTable } from "../lib/db/src/index.ts";
import { sql } from "drizzle-orm";

async function test() {
  try {
    console.log("Testing database connection...");
    const result = await db.execute(sql`SELECT 1`);
    console.log("Database connection successful:", result.rows);

    console.log("Checking if usersTable exists...");
    const users = await db.select().from(usersTable).limit(1);
    console.log("Users table check successful, count:", users.length);
  } catch (error) {
    console.error("Database test failed:", error);
  } finally {
    process.exit();
  }
}

test();
